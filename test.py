import json
from pydantic import BaseModel
from typing import List

# Import your optimizer class
from app import MaterialOptimizer, Material, WindowConfiguration

def test_optimizer():
    """
    Test the material optimizer with different configurations
    """
    # Initialize the optimizer
    optimizer = MaterialOptimizer()
    
    # Test case: 5x7 outer frame, 2 inner sections (5x4 and 5x3), one with net sash, one mullion along height
    
    # Create materials for the configuration
    materials = [
        # Outer frame
        Material(
            code="SP-2001",  # 80mm Sliding Frame Premium
            height=5.0,
            width=7.0,
            quantity=1
        ),
        # Border
        Material(
            code="AUX-4021",  # T-Closing/Border Profile
            height=5.0,
            width=7.0,
            quantity=1
        ),
        # First inner section - 5x4
        Material(
            code="SP-2012",  # 55mm Sliding Sash 80 series
            height=5.0,
            width=4.0,
            quantity=1
        ),
        # Beading for first inner section
        Material(
            code="SP-2022",  # Sliding Beading Single Glass (Round) 80 series
            height=5.0,
            width=4.0,
            quantity=1
        ),
        # Net Sash for first inner section
        Material(
            code="SP-2014",  # Sliding Net Sash 80/88 series
            height=5.0,
            width=4.0,
            quantity=1
        ),
        # Second inner section - 5x3
        Material(
            code="SP-2012",  # 55mm Sliding Sash 80 series (same as first)
            height=5.0,
            width=3.0,
            quantity=1
        ),
        # Beading for second inner section
        Material(
            code="SP-2022",  # Sliding Beading Single Glass (Round) 80 series (same as first)
            height=5.0,
            width=3.0,
            quantity=1
        ),
        # Mullion along height
        Material(
            code="SP-2003",  # Fixed Mullion 80 series
            height=0.0,
            width=0.0,
            divider=5.0,  # Mullion along height (5 ft)
            quantity=1
        )
    ]
    
    # Create a window configuration
    config = WindowConfiguration(
        company="WizPlas",
        window_type="sliding",
        quantity=1,
        materials=materials
    )
    
    # Process the configuration
    optimizer.process_configurations([config])
    
    # Get the optimization results
    results = optimizer.calculate_project_summary()
    
    # Print the results in a readable format
    print_results(results)
    
    return results

def print_results(results):
    """Print optimization results in a readable format"""
    print("=" * 50)
    print("OPTIMIZATION RESULTS")
    print("=" * 50)
    print(f"Total Unique Materials: {results['total_unique_materials']}")
    print(f"Total Rods Used: {results['total_rods_used']}")
    print(f"Total Wastage (ft): {results['total_wastage']:.2f}")
    print(f"Total Price (Per Rod): ₨ {results['total_project_price_per_rod']:.2f}")
    print(f"Total Price (Per Ft): ₨ {results['total_project_price_per_ft']:.2f}")
    print(f"Total Wastage Cost: ₨ {results['total_wastage_cost']:.2f}")
    print("\n")
    
    print("MATERIAL DETAILS:")
    for material in results['material_details']:
        details = material['material_details']
        print("-" * 50)
        print(f"Material: {details['description']} ({details['code']})")
        print(f"Total Length: {material['total_length']:.2f} ft")
        print(f"Rods Required: {material['total_rods_required']}")
        print(f"Wastage: {material['total_wastage']:.2f} ft")
        print(f"Price (Per Rod): ₨ {material['total_price_per_rod']:.2f}")
        print(f"Price (Per Ft): ₨ {material['total_price_per_ft']:.2f}")
        
        print("\nCutting Details:")
        for i, rod in enumerate(material['rods_used']):
            print(f"  Rod {i+1}:", end=" ")
            for piece in rod:
                print(f"{piece['length']:.1f}", end=" ")
            
            # Print leftover if any
            if i < len(material['leftovers']) and material['leftovers'][i] > 0:
                print(f"[Leftover: {material['leftovers'][i]:.1f}]", end="")
            print()
        
        # Print reused material if any
        if material['reused_material']:
            print("\nReused Material:")
            for i, piece in enumerate(material['reused_material']):
                source = piece.get('source', f"Leftover {piece.get('original_leftover_index', i)+1}")
                print(f"  {source}: {piece['length']:.1f} ft")
        
        print()
    
    print("\nAVAILABLE LEFTOVERS:")
    for code, leftovers in results['available_leftovers'].items():
        print(f"{code}: {', '.join([f'{l:.2f} ft' for l in leftovers])}")

if __name__ == "__main__":
    test_results = test_optimizer()
    
    # Optionally, save results to a JSON file for further analysis
    with open('test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
        print("\nResults saved to test_results.json")