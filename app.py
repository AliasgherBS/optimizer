import json
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Window Material Optimizer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load product data
with open('window_data.json', 'r') as f:
    PRODUCT_DATA = json.load(f)

# Pydantic models for request validation
class Material(BaseModel):
    code: str
    height: float = 0.0
    width: float = 0.0
    divider: float = 0.0
    quantity: int

class WindowConfiguration(BaseModel):
    company: str
    window_type: str
    quantity: int
    materials: List[Material]

class OptimizationRequest(BaseModel):
    configurations: List[WindowConfiguration]

class MaterialOptimizer:
    def __init__(self, raw_length=19):
        """
        Initialize the material optimizer with product data and raw material length
        
        :param raw_length: Length of raw material rod in feet
        """
        self.product_data = PRODUCT_DATA
        self.raw_length = raw_length
        self.project_materials = []
        self.available_leftovers = {}  # Store leftovers by material code
        self.material_codes_used = set()  # Track unique materials

    def get_product_by_code(self, code: str, company: str):
        """
        Find product details by code within the specified company
        
        :param code: Product code
        :param company: Company name
        :return: Product details or None
        """
        company_data = self.product_data.get(company, {})
        
        # Search through all window types and categories
        for window_type, categories in company_data.items():
            for category, products_list in categories.items():
                for product in products_list:
                    if product["Code"] == code:
                        return product
        
        return None

    def add_material(self, code: str, company: str, height: float, width: float, quantity: int, divider: float = 0):
        """
        Add a material specification to the project
        
        :param code: Product code
        :param company: Company name
        :param height: Height of the cut piece
        :param width: Width of the cut piece
        :param quantity: Number of pieces to cut
        :param divider: Length of divider (optional)
        """
        # Find product to verify and get pricing
        product = self.get_product_by_code(code, company)
        if not product:
            raise ValueError(f"Product not found: {code} for company {company}")
        
        material_spec = {
            'code': code,
            'company': company,
            'description': product['Product Description'],
            'height': height,
            'width': width,
            'divider': divider,
            'quantity': quantity,
            'unit_price': product['Rate/ft (PKR)'],
            'rod_price': product['Rate/19 ft Length (PKR)']
        }
        
        self.project_materials.append(material_spec)
        self.material_codes_used.add(code)  # Add to unique materials set
        return material_spec

    def optimize_cutting(self):
        """
        Optimize cutting for all added materials with improved packing strategy
        """
        cutting_results = []
        
        for material in self.project_materials:
            material_key = material['code']
            
            # Calculate cuts for this specific material
            total_vertical = material['height'] * 2 * material['quantity']
            total_horizontal = material['width'] * 2 * material['quantity']
            total_dividers = material['divider'] * material['quantity'] if material['divider'] > 0 else 0
            
            # Combine all pieces to cut in a single list
            pieces_to_cut = []
            
            # Add vertical pieces (height)
            if material['height'] > 0:
                pieces_to_cut.extend([
                    {'length': material['height'], 'type': 'height'} 
                    for _ in range(2 * material['quantity'])
                ])
            
            # Add horizontal pieces (width)
            if material['width'] > 0:
                pieces_to_cut.extend([
                    {'length': material['width'], 'type': 'width'} 
                    for _ in range(2 * material['quantity'])
                ])
            
            # Add dividers if any
            if material['divider'] > 0:
                pieces_to_cut.extend([
                    {'length': material['divider'], 'type': 'divider'} 
                    for _ in range(material['quantity'])
                ])
            
            # Sort pieces in descending order for better optimization
            pieces_to_cut.sort(key=lambda x: x['length'], reverse=True)
            
            # Initialize variables
            rods_used = []
            leftovers = []
            remaining_pieces = []
            used_leftover_pieces = []
            used_leftover_sources = []
            
            # First, try to use existing leftovers
            if material_key in self.available_leftovers:
                # Sort leftovers in descending order for better usage
                available_leftovers = sorted([(i, leftover) for i, leftover in enumerate(self.available_leftovers[material_key])], 
                                        key=lambda x: x[1], reverse=True)
                
                for piece in list(pieces_to_cut):  # Use a copy to safely remove items during iteration
                    piece_fitted = False
                    
                    for i, (index, leftover) in enumerate(available_leftovers):
                        if leftover >= piece['length']:
                            # Use this leftover
                            remaining_leftover = leftover - piece['length']
                            used_piece = {
                                'original_leftover_index': index,
                                'length': piece['length'],
                                'type': piece['type'],
                                'remaining': remaining_leftover,
                                'source': f"Leftover {index+1}"
                            }
                            used_leftover_pieces.append(used_piece)
                            used_leftover_sources.append(index)
                            
                            # Update the available leftover
                            if remaining_leftover > 0:
                                available_leftovers[i] = (index, remaining_leftover)
                            else:
                                available_leftovers.pop(i)
                            
                            # Remove the piece from pieces_to_cut
                            pieces_to_cut.remove(piece)
                            piece_fitted = True
                            break
                    
                    if not piece_fitted:
                        remaining_pieces.append(piece)
                
                # Update available leftovers after usage
                self.available_leftovers[material_key] = [leftover for _, leftover in available_leftovers if leftover > 0]
                if not self.available_leftovers[material_key]:
                    del self.available_leftovers[material_key]
            else:
                remaining_pieces = pieces_to_cut
            
            # Now handle remaining pieces with new rods
            rod_length = self.raw_length
            
            # IMPROVED ALGORITHM: First Fit Decreasing but maximizing rod utilization
            # We'll try to fit pieces in the current rod until it's full, then move to a new rod
            
            # Sort remaining pieces by length (largest first)
            remaining_pieces.sort(key=lambda x: x['length'], reverse=True)
            current_rod = []
            current_rod_remaining = rod_length
            
            # Process one rod at a time, filling it as much as possible
            while remaining_pieces:
                # Find the largest piece that fits in current rod
                piece_index = None
                for i, piece in enumerate(remaining_pieces):
                    if piece['length'] <= current_rod_remaining:
                        piece_index = i
                        break
                
                if piece_index is not None:
                    # Add piece to current rod
                    piece = remaining_pieces.pop(piece_index)
                    current_rod.append(piece)
                    current_rod_remaining -= piece['length']
                else:
                    # No piece fits in current rod, start a new rod
                    # Save the current rod if it has pieces
                    if current_rod:
                        rods_used.append(current_rod)
                        leftovers.append(current_rod_remaining)
                        if current_rod_remaining > 0:
                            if material_key not in self.available_leftovers:
                                self.available_leftovers[material_key] = []
                            self.available_leftovers[material_key].append(current_rod_remaining)
                    
                    # Start new rod with largest remaining piece
                    if remaining_pieces:
                        piece = remaining_pieces.pop(0)  # Take the largest piece
                        current_rod = [piece]
                        current_rod_remaining = rod_length - piece['length']
            
            # Add the last rod if it has any pieces
            if current_rod:
                rods_used.append(current_rod)
                leftovers.append(current_rod_remaining)
                if current_rod_remaining > 0:
                    if material_key not in self.available_leftovers:
                        self.available_leftovers[material_key] = []
                    self.available_leftovers[material_key].append(current_rod_remaining)
            
            # Calculate total price for this material
            total_length = total_vertical + total_horizontal + total_dividers
            total_price_per_ft = total_length * material['unit_price']
            total_rods_needed = len(rods_used)
            total_price_per_rod = total_rods_needed * material['rod_price']
            
            # Calculate wastage cost
            wastage_cost = total_price_per_rod - total_price_per_ft
            
            cutting_results.append({
                'material_details': material,
                'rods_used': rods_used,
                'leftovers': leftovers,
                'total_wastage': ((self.raw_length * total_rods_needed) - total_length),
                'wastage_cost': wastage_cost,
                'total_rods_required': total_rods_needed,
                'total_length': total_length,
                'total_price_per_ft': total_price_per_ft,
                'total_price_per_rod': total_price_per_rod,
                'reused_material': used_leftover_pieces,
                'reused_length': sum(piece['length'] for piece in used_leftover_pieces),
                'reused_sources': used_leftover_sources
            })

        return cutting_results

    def calculate_project_summary(self):
        """
        Calculate overall project summary
        
        :return: Project-wide summary of materials, cutting, and pricing
        """
        cutting_results = self.optimize_cutting()
        
        project_summary = {
            'total_unique_materials': len(self.material_codes_used),
            'total_material_types': len(cutting_results),
            'total_rods_used': sum(result['total_rods_required'] for result in cutting_results),
            'total_wastage': sum(result['total_wastage'] for result in cutting_results),
            'total_project_price_per_ft': sum(result['total_price_per_ft'] for result in cutting_results),
            'total_project_price_per_rod': sum(result['total_price_per_rod'] for result in cutting_results),
            'total_wastage_cost': (sum(result['total_price_per_rod'] for result in cutting_results) - 
                                  sum(result['total_price_per_ft'] for result in cutting_results)),
            'material_details': cutting_results,
            'available_leftovers': self.available_leftovers
        }
        
        return project_summary

    def process_configurations(self, configurations: List[WindowConfiguration]):
        """
        Process all window configurations and add necessary materials
        
        :param configurations: List of window configurations
        """
        for config in configurations:
            # Process all materials in the configuration
            for material in config.materials:
                self.add_material(
                    code=material.code,
                    company=config.company,
                    height=material.height,
                    width=material.width,
                    quantity=material.quantity,
                    divider=material.divider
                )

@app.get("/")
def home():
    return {"message": "Window Material Optimizer API is running"}

@app.get("/product-options")
def get_product_options():
    """
    Get all available product options
    """
    return PRODUCT_DATA

@app.post("/optimize")
def optimize_windows(request: OptimizationRequest = Body(...)):
    """
    Optimize cutting for windows based on configurations
    """
    try:
        optimizer = MaterialOptimizer()
        
        # Process configurations
        optimizer.process_configurations(request.configurations)
        
        # Get optimization results
        project_summary = optimizer.calculate_project_summary()
        
        return project_summary
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# If running as script, create the data file
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)