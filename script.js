// Global variables
let currentStep = 1;
let windowConfigurations = [];
let productData = null;
let selectedCompany = '';

// Constants
const API_BASE_URL = 'http://localhost:8000';
const TOTAL_STEPS = 5;

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    const apiStatus = document.getElementById('api-status');
    
    try {
        // Test API connection
        const response = await fetch(`${API_BASE_URL}/product-options`);
        
        if (response.ok) {
            apiStatus.textContent = 'Connected to API';
            apiStatus.className = 'connected';
            productData = await response.json();
            
            // Populate company dropdown
            populateCompanyDropdown();
            
            // Add event listeners
            document.getElementById('company').addEventListener('change', handleCompanyChange);
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error('API connection error:', error);
        apiStatus.textContent = 'API Connection Error: Please make sure the backend server is running';
        apiStatus.className = 'error';
        
        // Show error alert
        setTimeout(() => {
            alert('Could not connect to the API server. Please make sure the backend server is running at http://localhost:8000');
        }, 500);
    }
});

// Populate company dropdown
function populateCompanyDropdown() {
    if (!productData) return;
    
    const companySelect = document.getElementById('company');
    companySelect.innerHTML = '<option value="">Select Company</option>';
    
    // Get company names from productData
    const companies = Object.keys(productData);
    
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
    });
}

// // Handle company selection change
// function handleCompanyChange() {
//     selectedCompany = document.getElementById('company').value;
    
//     // Reset window type dropdown since company changed
//     document.getElementById('window-type').value = '';
    
//     // Update material dropdowns
//     updateProductDropdowns();
    
//     // Clear material dropdowns
//     clearMaterialDropdowns();
// }

// Clear all material dropdowns
function clearMaterialDropdowns() {
    document.getElementById('out-frame').innerHTML = '<option value="">Select Outer Frame Material</option>';
    document.getElementById('border-material').innerHTML = '<option value="">Select Border Material</option>';
    // Inner sections will be cleared when added
}

// Toggle border selection visibility
function toggleBorderSelection() {
    const addBorder = document.getElementById('add-border').checked;
    document.getElementById('border-selection').style.display = addBorder ? 'block' : 'none';
}

// Toggle net sash selection visibility
function toggleNetSashSelection(checkbox) {
    const section = checkbox.closest('.inner-section');
    const netSashSelection = section.querySelector('.net-sash-selection');
    netSashSelection.style.display = checkbox.checked ? 'block' : 'none';
}

// Handle company selection change
function handleCompanyChange() {
    selectedCompany = document.getElementById('company').value;
    
    // Reset window type dropdown since company changed
    document.getElementById('window-type').value = '';
    
    // Clear material dropdowns
    clearMaterialDropdowns();
    
    // Update material dropdowns with new company data
    if (selectedCompany) {
        updateProductDropdowns();
    }
}

// Update product dropdowns based on company selection
function updateProductDropdowns() {
    if (!selectedCompany || !productData[selectedCompany]) return;
    
    // Clear existing options
    const outFrameSelect = document.getElementById('out-frame');
    const borderSelect = document.getElementById('border-material');
    
    outFrameSelect.innerHTML = '<option value="">Select Outer Frame Material</option>';
    borderSelect.innerHTML = '<option value="">Select Border Material</option>';
    
    // Get all window types for this company
    const windowTypes = Object.keys(productData[selectedCompany]);
    
    // For each window type, add materials grouped under it
    windowTypes.forEach(windowType => {
        const windowTypeData = productData[selectedCompany][windowType];
        if (!windowTypeData) return;
        
        // Format window type name for display
        const displayWindowType = windowType.charAt(0).toUpperCase() + windowType.slice(1).replace('_', ' ');
        
        // Create optgroups for this window type
        const outFrameOptGroup = document.createElement('optgroup');
        outFrameOptGroup.label = displayWindowType;
        
        const borderOptGroup = document.createElement('optgroup');
        borderOptGroup.label = displayWindowType;
        
        let hasOutFrames = false;
        let hasBorders = false;
        
        // Find all categories for this window type
        Object.keys(windowTypeData).forEach(category => {
            const materials = windowTypeData[category];
            
            // Add outer frame options
            if (category.includes('OutFrames') && Array.isArray(materials)) {
                materials.forEach(material => {
                    const option = document.createElement('option');
                    option.value = material.Code;
                    option.textContent = `${material.Code} - ${material['Product Description']} (${material['Rate/ft (PKR)']} PKR/ft)`;
                    option.dataset.category = category;
                    option.dataset.windowType = windowType;
                    outFrameOptGroup.appendChild(option);
                    hasOutFrames = true;
                });
            }
            
            // Add border options
            if (category.includes('Border') && Array.isArray(materials)) {
                materials.forEach(material => {
                    const option = document.createElement('option');
                    option.value = material.Code;
                    option.textContent = `${material.Code} - ${material['Product Description']} (${material['Rate/ft (PKR)']} PKR/ft)`;
                    option.dataset.category = category;
                    option.dataset.windowType = windowType;
                    borderOptGroup.appendChild(option);
                    hasBorders = true;
                });
            }
        });
        
        // Add the optgroups to selects if they have options
        if (hasOutFrames) {
            outFrameSelect.appendChild(outFrameOptGroup);
        }
        
        if (hasBorders) {
            borderSelect.appendChild(borderOptGroup);
        }
    });
    
    // Log for debugging
    console.log("Updated dropdowns. Outer frame options:", outFrameSelect.options.length);
    console.log("Border options:", borderSelect.options.length);
}

// Update window type based on selected material
function updateWindowTypeFromMaterial(select) {
    if (select.selectedOptions.length > 0) {
        const option = select.selectedOptions[0];
        if (option.dataset.windowType) {
            document.getElementById('window-type').value = option.dataset.windowType;
        }
    }
}

// Populate inner frame dropdowns for a section
function populateInnerFrameDropdowns(section) {
    if (!selectedCompany || !productData[selectedCompany]) return;
    
    // Get inner frame select elements
    const inFrameSelect = section.querySelector('.in-frame');
    const beadingSelect = section.querySelector('.beading');
    const netSashSelect = section.querySelector('.net-sash-material');
    
    // Clear options
    inFrameSelect.innerHTML = '<option value="">Select Inner Frame Material</option>';
    beadingSelect.innerHTML = '<option value="">Select Beading Material</option>';
    netSashSelect.innerHTML = '<option value="">Select Net Sash Material</option>';
    
    // Get all window types for this company
    const windowTypes = Object.keys(productData[selectedCompany]);
    
    // For each inner material type, group options by window type
    windowTypes.forEach(windowType => {
        const windowTypeData = productData[selectedCompany][windowType];
        if (!windowTypeData) return;
        
        // Find categories for each type
        const inFrameCategories = Object.keys(windowTypeData).filter(cat => cat.includes('Inframes'));
        const beadingCategories = Object.keys(windowTypeData).filter(cat => cat.includes('Beading'));
        const netSashCategories = Object.keys(windowTypeData).filter(cat => cat.includes('NetSash'));
        
        // Format window type name for display
        const displayWindowType = windowType.charAt(0).toUpperCase() + windowType.slice(1).replace('_', ' ');
        
        // Add inner frame options
        if (inFrameCategories.length > 0) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = displayWindowType;
            
            inFrameCategories.forEach(category => {
                if (windowTypeData[category] && Array.isArray(windowTypeData[category])) {
                    windowTypeData[category].forEach(material => {
                        const option = document.createElement('option');
                        option.value = material.Code;
                        option.textContent = `${material.Code} - ${material['Product Description']} (${material['Rate/ft (PKR)']} PKR/ft)`;
                        option.dataset.category = category;
                        option.dataset.windowType = windowType;
                        optGroup.appendChild(option);
                    });
                }
            });
            
            inFrameSelect.appendChild(optGroup);
        }
        
        // Add beading options
        if (beadingCategories.length > 0) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = displayWindowType;
            
            beadingCategories.forEach(category => {
                if (windowTypeData[category] && Array.isArray(windowTypeData[category])) {
                    windowTypeData[category].forEach(material => {
                        const option = document.createElement('option');
                        option.value = material.Code;
                        option.textContent = `${material.Code} - ${material['Product Description']} (${material['Rate/ft (PKR)']} PKR/ft)`;
                        option.dataset.category = category;
                        option.dataset.windowType = windowType;
                        optGroup.appendChild(option);
                    });
                }
            });
            
            beadingSelect.appendChild(optGroup);
        }
        
        // Add net sash options
        if (netSashCategories.length > 0) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = displayWindowType;
            
            netSashCategories.forEach(category => {
                if (windowTypeData[category] && Array.isArray(windowTypeData[category])) {
                    windowTypeData[category].forEach(material => {
                        const option = document.createElement('option');
                        option.value = material.Code;
                        option.textContent = `${material.Code} - ${material['Product Description']} (${material['Rate/ft (PKR)']} PKR/ft)`;
                        option.dataset.category = category;
                        option.dataset.windowType = windowType;
                        optGroup.appendChild(option);
                    });
                }
            });
            
            netSashSelect.appendChild(optGroup);
        }
    });
}

// Add inner section
function addInnerSection() {
    const innerSectionsContainer = document.getElementById('inner-sections-container');
    const noSectionsMessage = innerSectionsContainer.querySelector('.no-sections-message');
    
    if (noSectionsMessage) {
        noSectionsMessage.remove();
    }
    
    // Clone template
    const template = document.getElementById('inner-section-template');
    const section = template.content.cloneNode(true).querySelector('.inner-section');
    
    // Set section number
    const sectionCount = innerSectionsContainer.children.length + 1;
    section.querySelector('.section-number').textContent = sectionCount;
    
    // Add remove event
    section.querySelector('.remove-section').addEventListener('click', function() {
        section.remove();
        
        // Update section numbers
        const sections = innerSectionsContainer.querySelectorAll('.inner-section');
        sections.forEach((sec, index) => {
            sec.querySelector('.section-number').textContent = index + 1;
        });
        
        // Add message back if no sections
        if (sections.length === 0) {
            const message = document.createElement('div');
            message.className = 'no-sections-message';
            message.textContent = 'Click the "Add Section" button to add inner sections to your window.';
            innerSectionsContainer.appendChild(message);
        }
    });
    
    // Populate material dropdowns
    populateInnerFrameDropdowns(section);
    
    // Add to container
    innerSectionsContainer.appendChild(section);
}

// Toggle mullion configuration visibility
function toggleMullionConfig() {
    const needMullion = document.getElementById('need-mullion').value === 'true';
    document.getElementById('mullion-config-container').style.display = needMullion ? 'block' : 'none';
    
    // If toggling off, clear configurations
    if (!needMullion) {
        document.getElementById('mullion-configs').innerHTML = '';
    } else if (document.getElementById('mullion-configs').children.length === 0) {
        // Add initial mullion config if none exists
        addMullionConfig();
    }
}

// Add a new mullion configuration
function addMullionConfig() {
    const mullionConfigs = document.getElementById('mullion-configs');
    
    // Clone template
    const template = document.getElementById('mullion-config-template');
    const mullionConfig = template.content.cloneNode(true).querySelector('.mullion-config');
    
    // Add remove event
    mullionConfig.querySelector('.remove-mullion').addEventListener('click', function() {
        mullionConfig.remove();
    });
    
    // Populate mullion material dropdown
    if (selectedCompany && productData[selectedCompany]) {
        const windowTypes = Object.keys(productData[selectedCompany]);
        const mullionSelect = mullionConfig.querySelector('.mullion-material');
        
        mullionSelect.innerHTML = '<option value="">Select Mullion Material</option>';
        
        // For each window type, add mullion materials
        windowTypes.forEach(windowType => {
            const windowTypeData = productData[selectedCompany][windowType];
            if (!windowTypeData) return;
            
            const mullionCategories = Object.keys(windowTypeData).filter(cat => cat.includes('Mullions'));
            
            // Format window type name for display
            const displayWindowType = windowType.charAt(0).toUpperCase() + windowType.slice(1).replace('_', ' ');
            
            if (mullionCategories.length > 0) {
                const optGroup = document.createElement('optgroup');
                optGroup.label = displayWindowType;
                
                mullionCategories.forEach(category => {
                    if (windowTypeData[category] && Array.isArray(windowTypeData[category])) {
                        windowTypeData[category].forEach(material => {
                            const option = document.createElement('option');
                            option.value = material.Code;
                            option.textContent = `${material.Code} - ${material['Product Description']} (${material['Rate/ft (PKR)']} PKR/ft)`;
                            option.dataset.category = category;
                            option.dataset.windowType = windowType;
                            optGroup.appendChild(option);
                        });
                    }
                });
                
                mullionSelect.appendChild(optGroup);
            }
        });
    }
    
    mullionConfigs.appendChild(mullionConfig);
}

// Navigation functions
function nextStep(stepNum) {
    if (validateStep(stepNum)) {
        hideStep(stepNum);
        const nextStepNum = stepNum + 1;
        showStep(nextStepNum);
        updateProgressBar(nextStepNum);
        
        // If moving to review step, update summary
        if (nextStepNum === 5) {
            updateWindowSummary();
        }
    }
}

function prevStep(stepNum) {
    hideStep(stepNum);
    const prevStepNum = stepNum - 1;
    showStep(prevStepNum);
    updateProgressBar(prevStepNum);
}

function hideStep(step) {
    document.getElementById(`step${step}`).classList.remove('active');
}

function showStep(step) {
    document.getElementById(`step${step}`).classList.add('active');
    window.scrollTo(0, 0);
}

function updateProgressBar(step) {
    const progress = document.getElementById('progress');
    const percentage = (step / TOTAL_STEPS) * 100;
    progress.style.width = `${percentage}%`;
}

// Validation functions
function validateStep(step) {
    let isValid = true;
    
    switch (step) {
        case 1:
            // Validate company and quantity
            const company = document.getElementById('company').value;
            const windowQuantity = parseInt(document.getElementById('window-quantity').value);
            
            if (!company) {
                showError('company-error');
                isValid = false;
            } else {
                hideError('company-error');
            }
            
            if (!windowQuantity || windowQuantity <= 0) {
                showError('window-quantity-error');
                isValid = false;
            } else {
                hideError('window-quantity-error');
            }
            return isValid;
            
        case 2:
            // Validate outer frame
            const outerFrameHeight = parseFloat(document.getElementById('outer-frame-height').value);
            const outerFrameWidth = parseFloat(document.getElementById('outer-frame-width').value);
            const outFrame = document.getElementById('out-frame').value;
            
            if (!outerFrameHeight || outerFrameHeight <= 0) {
                showError('outer-frame-height-error');
                isValid = false;
            } else {
                hideError('outer-frame-height-error');
            }
            
            if (!outerFrameWidth || outerFrameWidth <= 0) {
                showError('outer-frame-width-error');
                isValid = false;
            } else {
                hideError('outer-frame-width-error');
            }
            
            if (!outFrame) {
                showError('out-frame-error');
                isValid = false;
            } else {
                hideError('out-frame-error');
            }
            
            // Validate border if checked
            const addBorder = document.getElementById('add-border').checked;
            if (addBorder) {
                const borderMaterial = document.getElementById('border-material').value;
                if (!borderMaterial) {
                    showError('border-material-error');
                    isValid = false;
                } else {
                    hideError('border-material-error');
                }
            }
            
            return isValid;
            
        // Continuing the validateStep function from where we left off...
            
        case 3:
            // Validate inner sections
            const innerSections = document.getElementById('inner-sections-container').querySelectorAll('.inner-section');
            
            if (innerSections.length === 0) {
                alert('Please add at least one inner section.');
                isValid = false;
                return isValid;
            }
            
            // Validate each inner section
            for (const section of innerSections) {
                const sectionHeight = parseFloat(section.querySelector('.section-height').value);
                const sectionWidth = parseFloat(section.querySelector('.section-width').value);
                const inFrame = section.querySelector('.in-frame').value;
                const beading = section.querySelector('.beading').value;
                const addNetSash = section.querySelector('.add-net-sash').checked;
                
                if (!sectionHeight || sectionHeight <= 0) {
                    section.querySelector('.section-height').nextElementSibling.style.display = 'block';
                    isValid = false;
                } else {
                    section.querySelector('.section-height').nextElementSibling.style.display = 'none';
                }
                
                if (!sectionWidth || sectionWidth <= 0) {
                    section.querySelector('.section-width').nextElementSibling.style.display = 'block';
                    isValid = false;
                } else {
                    section.querySelector('.section-width').nextElementSibling.style.display = 'none';
                }
                
                if (!inFrame) {
                    section.querySelector('.in-frame').nextElementSibling.style.display = 'block';
                    isValid = false;
                } else {
                    section.querySelector('.in-frame').nextElementSibling.style.display = 'none';
                }
                
                if (!beading) {
                    section.querySelector('.beading').nextElementSibling.style.display = 'block';
                    isValid = false;
                } else {
                    section.querySelector('.beading').nextElementSibling.style.display = 'none';
                }
                
                if (addNetSash) {
                    const netSashMaterial = section.querySelector('.net-sash-material').value;
                    if (!netSashMaterial) {
                        section.querySelector('.net-sash-material').nextElementSibling.style.display = 'block';
                        isValid = false;
                    } else {
                        section.querySelector('.net-sash-material').nextElementSibling.style.display = 'none';
                    }
                }
            }
            
            return isValid;
            
        case 4:
            // Validate mullions if needed
            const needMullion = document.getElementById('need-mullion').value === 'true';
            
            if (needMullion) {
                const mullionConfigs = document.getElementById('mullion-configs').querySelectorAll('.mullion-config');
                
                if (mullionConfigs.length === 0) {
                    alert('Please add at least one mullion configuration.');
                    isValid = false;
                    return isValid;
                }
                
                // Validate each mullion config
                for (const config of mullionConfigs) {
                    const mullionMaterial = config.querySelector('.mullion-material').value;
                    
                    if (!mullionMaterial) {
                        config.querySelector('.mullion-material').nextElementSibling.style.display = 'block';
                        isValid = false;
                    } else {
                        config.querySelector('.mullion-material').nextElementSibling.style.display = 'none';
                    }
                }
            }
            
            return isValid;
    }
    
    return isValid;
}

function showError(errorId) {
    document.getElementById(errorId).style.display = 'block';
}

function hideError(errorId) {
    document.getElementById(errorId).style.display = 'none';
}

// Update window summary in review step
function updateWindowSummary() {
    const company = document.getElementById('company').value;
    const windowQuantity = parseInt(document.getElementById('window-quantity').value);
    const windowType = document.getElementById('window-type').value;
    
    const outerFrameHeight = parseFloat(document.getElementById('outer-frame-height').value);
    const outerFrameWidth = parseFloat(document.getElementById('outer-frame-width').value);
    const outFrameCode = document.getElementById('out-frame').value;
    
    const addBorder = document.getElementById('add-border').checked;
    const borderMaterial = addBorder ? document.getElementById('border-material').value : null;
    
    // Get inner sections
    const innerSections = [];
    const innerSectionElements = document.getElementById('inner-sections-container').querySelectorAll('.inner-section');
    
    innerSectionElements.forEach(section => {
        const sectionHeight = parseFloat(section.querySelector('.section-height').value);
        const sectionWidth = parseFloat(section.querySelector('.section-width').value);
        const inFrameCode = section.querySelector('.in-frame').value;
        const beadingCode = section.querySelector('.beading').value;
        const addNetSash = section.querySelector('.add-net-sash').checked;
        const netSashCode = addNetSash ? section.querySelector('.net-sash-material').value : null;
        
        innerSections.push({
            height: sectionHeight,
            width: sectionWidth,
            in_frame_code: inFrameCode,
            beading_code: beadingCode,
            net_sash_code: netSashCode
        });
    });
    
    // Get mullion configurations if any
    const needMullion = document.getElementById('need-mullion').value === 'true';
    let mullionConfigs = [];
    
    if (needMullion) {
        const configElements = document.getElementById('mullion-configs').querySelectorAll('.mullion-config');
        
        configElements.forEach(config => {
            const count = parseInt(config.querySelector('.mullion-count').value);
            const orientation = config.querySelector('.mullion-orientation').value;
            const material = config.querySelector('.mullion-material').value;
            
            mullionConfigs.push({ 
                count, 
                orientation,
                material
            });
        });
    }
    
    // Create current window configuration object
    const currentConfig = {
        company,
        window_type: windowType,
        quantity: windowQuantity,
        outer_frame: {
            height: outerFrameHeight,
            width: outerFrameWidth,
            code: outFrameCode
        },
        border: addBorder ? { code: borderMaterial } : null,
        inner_sections: innerSections,
        mullions: needMullion ? mullionConfigs : null
    };
    
    // Add to window configurations array
    currentConfig.id = Date.now(); // Unique ID for each window
    windowConfigurations.push(currentConfig);
    
    // Update summary HTML
    updateWindowConfigurationsDisplay();
}

// Update the display of all window configurations
function updateWindowConfigurationsDisplay() {
    const summaryDiv = document.getElementById('window-summary');
    summaryDiv.innerHTML = '';
    
    windowConfigurations.forEach((config, index) => {
        try {
            // Find product descriptions
            const company = config.company;
            const windowType = config.window_type;
            const companyData = productData[company];
            const windowTypeData = companyData[windowType];
            
            // Outer frame description
            let outFrameTypeKey = '';
            for (const key in windowTypeData) {
                if (key.includes('OutFrames')) {
                    outFrameTypeKey = key;
                    break;
                }
            }
            const outFrameDesc = getProductDescription(windowTypeData, outFrameTypeKey, config.outer_frame.code);
            
            // Border description
            let borderDesc = '';
            if (config.border) {
                let borderTypeKey = '';
                for (const key in windowTypeData) {
                    if (key.includes('Border')) {
                        borderTypeKey = key;
                        break;
                    }
                }
                borderDesc = getProductDescription(windowTypeData, borderTypeKey, config.border.code);
            }
            
            // Create inner sections HTML
            let innerSectionsHTML = '';
            if (config.inner_sections && config.inner_sections.length > 0) {
                innerSectionsHTML = '<div class="card-section"><h4>Inner Sections:</h4>';
                
                config.inner_sections.forEach((section, idx) => {
                    // Find descriptions
                    let inFrameTypeKey = '';
                    let beadingTypeKey = '';
                    let netSashTypeKey = '';
                    
                    for (const key in windowTypeData) {
                        if (key.includes('Inframes')) inFrameTypeKey = key;
                        else if (key.includes('Beading')) beadingTypeKey = key;
                        else if (key.includes('NetSash')) netSashTypeKey = key;
                    }
                    
                    const inFrameDesc = getProductDescription(windowTypeData, inFrameTypeKey, section.in_frame_code);
                    const beadingDesc = getProductDescription(windowTypeData, beadingTypeKey, section.beading_code);
                    
                    innerSectionsHTML += `
                        <div class="section-summary">
                            <p><strong>Section ${idx + 1}:</strong> ${section.height} ft × ${section.width} ft</p>
                            <p><strong>Inner Frame:</strong> ${inFrameDesc} (${section.in_frame_code})</p>
                            <p><strong>Beading:</strong> ${beadingDesc} (${section.beading_code})</p>
                    `;
                    
                    if (section.net_sash_code) {
                        const netSashDesc = getProductDescription(windowTypeData, netSashTypeKey, section.net_sash_code);
                        innerSectionsHTML += `<p><strong>Net Sash:</strong> ${netSashDesc} (${section.net_sash_code})</p>`;
                    }
                    
                    innerSectionsHTML += '</div>';
                });
                
                innerSectionsHTML += '</div>';
            }
            
            // Create mullion HTML if any
            let mullionsHTML = '';
            if (config.mullions && config.mullions.length > 0) {
                mullionsHTML = '<div class="card-section"><h4>Mullions:</h4>';
                
                config.mullions.forEach((mullion, idx) => {
                    let mullionTypeKey = '';
                    for (const key in windowTypeData) {
                        if (key.includes('Mullions')) {
                            mullionTypeKey = key;
                            break;
                        }
                    }
                    
                    const mullionDesc = getProductDescription(windowTypeData, mullionTypeKey, mullion.material);
                    
                    mullionsHTML += `
                        <p><strong>Mullion ${idx + 1}:</strong> ${mullion.count} mullion(s) along ${mullion.orientation}</p>
                        <p><strong>Material:</strong> ${mullionDesc} (${mullion.material})</p>
                    `;
                });
                
                mullionsHTML += '</div>';
            }
            
            const windowCard = document.createElement('div');
            windowCard.className = 'window-card';
            windowCard.id = `window-${config.id}`;
            
            windowCard.innerHTML = `
                <h3>Window ${index + 1} <button class="delete-window" onclick="deleteWindow(${config.id})"><i class="fas fa-times"></i></button></h3>
                <div class="card-section">
                    <p><strong>Company:</strong> ${config.company}</p>
                    <p><strong>Type:</strong> ${windowType.charAt(0).toUpperCase() + windowType.slice(1).replace('_', ' ')}</p>
                    <p><strong>Quantity:</strong> ${config.quantity}</p>
                </div>
                <div class="card-section">
                    <p><strong>Outer Frame Dimensions:</strong> ${config.outer_frame.height} ft × ${config.outer_frame.width} ft</p>
                    <p><strong>Outer Frame Material:</strong> ${outFrameDesc} (${config.outer_frame.code})</p>
                    ${config.border ? `<p><strong>Border Material:</strong> ${borderDesc} (${config.border.code})</p>` : ''}
                </div>
                ${innerSectionsHTML}
                ${mullionsHTML}
            `;
            
            summaryDiv.appendChild(windowCard);
        } catch (error) {
            console.error("Error rendering window card:", error, config);
            // Create a simple error card instead
            const errorCard = document.createElement('div');
            errorCard.className = 'window-card';
            errorCard.id = `window-${config.id}`;
            errorCard.innerHTML = `
                <h3>Window ${index + 1} <button class="delete-window" onclick="deleteWindow(${config.id})"><i class="fas fa-times"></i></button></h3>
                <div class="card-section">
                    <p><strong>Error rendering window configuration</strong></p>
                    <p>Please check your window configuration and try again.</p>
                </div>
            `;
            summaryDiv.appendChild(errorCard);
        }
    });
}

// Helper function to get product description
function getProductDescription(data, category, code) {
    if (!data || !category || !code) return 'Unknown';
    
    if (!data[category]) return 'Unknown';
    
    const product = data[category].find(item => item.Code === code);
    return product ? product['Product Description'] : 'Unknown';
}

// Delete a window configuration
function deleteWindow(id) {
    windowConfigurations = windowConfigurations.filter(config => config.id !== id);
    updateWindowConfigurationsDisplay();
}

// Add another window and reset form
function addAnotherWindow() {
    // Reset step 2 - Outer Frame
    document.getElementById('outer-frame-height').value = '';
    document.getElementById('outer-frame-width').value = '';
    document.getElementById('window-type').value = '';
    document.getElementById('out-frame').innerHTML = '<option value="">Select Outer Frame Material</option>';
    document.getElementById('add-border').checked = false;
    document.getElementById('border-material').innerHTML = '<option value="">Select Border Material</option>';
    document.getElementById('border-selection').style.display = 'none';
    
    // Update dropdowns
    updateProductDropdowns();
    
    // Reset step 3 - Inner Sections
    document.getElementById('inner-sections-container').innerHTML = `
        <div class="no-sections-message">Click the "Add Section" button to add inner sections to your window.</div>
    `;
    
    // Reset step 4 - Mullions
    document.getElementById('need-mullion').value = 'false';
    document.getElementById('mullion-configs').innerHTML = '';
    document.getElementById('mullion-config-container').style.display = 'none';
    
    // Hide any error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => el.style.display = 'none');
    
    // Go back to step 2 (keep company selection)
    hideStep(5);
    showStep(2);
    updateProgressBar(2);
}

// Submit window configurations for optimization
async function submitConfiguration() {
    console.log("Submit Configuration function called");
    
    if (windowConfigurations.length === 0) {
        alert('Please add at least one window configuration.');
        return;
    }
    
    try {
        // Convert configurations to API format
        const apiConfigurations = windowConfigurations.map(config => {
            // Process inner sections to create appropriate materials
            const materialsList = [];
            
            // Add outer frame
            materialsList.push({
                code: config.outer_frame.code,
                height: config.outer_frame.height,
                width: config.outer_frame.width,
                quantity: config.quantity
            });
            
            // Add border if any
            if (config.border) {
                materialsList.push({
                    code: config.border.code,
                    height: config.outer_frame.height,
                    width: config.outer_frame.width,
                    quantity: config.quantity
                });
            }
            
            // Add inner sections materials
            if (config.inner_sections) {
                config.inner_sections.forEach(section => {
                    // Add inner frame
                    materialsList.push({
                        code: section.in_frame_code,
                        height: section.height,
                        width: section.width,
                        quantity: config.quantity
                    });
                    
                    // Add beading
                    materialsList.push({
                        code: section.beading_code,
                        height: section.height,
                        width: section.width,
                        quantity: config.quantity
                    });
                    
                    // Add net sash if any
                    if (section.net_sash_code) {
                        materialsList.push({
                            code: section.net_sash_code,
                            height: section.height,
                            width: section.width,
                            quantity: config.quantity
                        });
                    }
                });
            }
            
            // Add mullion configurations if any
            if (config.mullions && config.mullions.length > 0) {
                config.mullions.forEach(mullion => {
                    // Calculate mullion length based on orientation
                    const mullionLength = mullion.orientation === 'width' ? 
                        config.outer_frame.width : config.outer_frame.height;
                    
                    materialsList.push({
                        code: mullion.material,
                        height: 0,
                        width: 0,
                        divider: mullionLength,
                        quantity: mullion.count * config.quantity
                    });
                });
            }
            
            return {
                company: config.company,
                quantity: config.quantity,
                materials: materialsList,
                window_type: config.window_type
            };
        });
        
        // Prepare the request body
        const requestBody = {
            configurations: apiConfigurations
        };
        
        console.log("Sending data to API:", requestBody);
        
        // Show loading indicator or message
        document.getElementById('results').innerHTML = '<div class="loading">Processing optimization... Please wait.</div>';
        document.getElementById('results').style.display = 'block';
        
        // Send API request to backend
        const response = await fetch(`${API_BASE_URL}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse the API response
        const optimizationResults = await response.json();
        console.log("Received results:", optimizationResults);
        
        // Display results
        displayResults(optimizationResults);
        
        // Scroll to results
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error submitting configuration:', error);
        alert('Error calculating optimization. Please try again. ' + error.message);
        document.getElementById('results').style.display = 'none';
    }
}

// Display optimization results
function displayResults(results) {
    // Rebuild the entire results container
    const resultsContainer = document.getElementById('results');
    resultsContainer.style.display = 'block';
    
    // Create the results container HTML
    resultsContainer.innerHTML = `
        <div class="results-header">
            <h2>Optimization Results</h2>
            <button class="print-btn" onclick="window.print()">
                <i class="fas fa-print"></i> Print Results
            </button>
        </div>
        
        <div class="summary-box">
            <div class="summary-item">
                <h3>Unique Materials</h3>
                <p id="total-unique-materials">${results.total_unique_materials}</p>
            </div>
            
            <div class="summary-item">
                <h3>Total Rods Used</h3>
                <p id="total-rods">${results.total_rods_used}</p>
            </div>
            
            <div class="summary-item">
                <h3>Total Wastage (ft)</h3>
                <p id="total-wastage">${results.total_wastage.toFixed(2)}</p>
            </div>
            
            <div class="summary-item">
                <h3>Cost Per Rod (PKR)</h3>
                <p id="total-price-rod">${results.total_project_price_per_rod.toFixed(2)}</p>
            </div>
            
            <div class="summary-item">
                <h3>Cost Per Ft (PKR)</h3>
                <p id="total-price-ft">${results.total_project_price_per_ft.toFixed(2)}</p>
            </div>
            
            <div class="summary-item">
                <h3>Wastage Cost (PKR)</h3>
                <p id="total-wastage-cost">${results.total_wastage_cost.toFixed(2)}</p>
            </div>
        </div>
        
        <div class="material-details" id="material-details">
            <h3>Material Details</h3>
        </div>
    `;
    
    // Get reference to the material details container
    const materialDetailsContainer = document.getElementById('material-details');
    
    // Add legend
    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background-color: var(--secondary-color);"></div>
            <span>New Cut Pieces</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: var(--warning-color);"></div>
            <span>Leftover Material</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: var(--reused-color);"></div>
            <span>Reused Material</span>
        </div>
    `;
    materialDetailsContainer.appendChild(legend);
    
    // Group materials by code to organize cutting diagrams by material type
    const materialsByCode = {};
    
    results.material_details.forEach(material => {
        const code = material.material_details.code;
        if (!materialsByCode[code]) {
            materialsByCode[code] = [];
        }
        materialsByCode[code].push(material);
    });
    
    // Loop through each material type
    Object.entries(materialsByCode).forEach(([code, materials]) => {
        // Calculate totals for this material type
        const totalLength = materials.reduce((sum, mat) => sum + mat.total_length, 0);
        const totalRods = materials.reduce((sum, mat) => sum + mat.total_rods_required, 0);
        const totalWastage = materials.reduce((sum, mat) => sum + mat.total_wastage, 0);
        const totalPricePerFt = materials.reduce((sum, mat) => sum + mat.total_price_per_ft, 0);
        const totalPricePerRod = materials.reduce((sum, mat) => sum + mat.total_price_per_rod, 0);
        
        // Get product details from the first material (they should all be the same code)
        const details = materials[0].material_details;
        
        const materialCard = document.createElement('div');
        materialCard.className = 'material-card';
        
        // Create summary section for this material type
        materialCard.innerHTML = `
            <div class="material-header">
                <div class="material-title">${details.description || details.code} (${details.code})</div>
                <div class="material-price">₨ ${totalPricePerRod.toFixed(2)}</div>
            </div>
            
            <div class="material-specs">
                <div class="spec-item">
                    <div class="spec-label">Total Material Length</div>
                    <div class="spec-value">${totalLength.toFixed(2)} ft</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Rods Required</div>
                    <div class="spec-value">${totalRods}</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Wastage</div>
                    <div class="spec-value">${totalWastage.toFixed(2)} ft</div>
                </div>
            </div>
            
            <div class="price-section">
                <div class="price-item">
                    <div class="price-heading">Price Per Ft Basis</div>
                    <div class="price-value">₨ ${totalPricePerFt.toFixed(2)}</div>
                </div>
                <div class="price-item">
                    <div class="price-heading">Price Per Rod Basis</div>
                    <div class="price-value">₨ ${totalPricePerRod.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="cutting-diagram">
                <h4>Cutting Diagram for ${details.code}</h4>
        `;
        
        // Create simplified cutting diagram
        const rodLength = 19; // Standard rod length in feet
        
        // Combine all rods for this material
        const allRods = [];
        let totalReusedLength = 0;
        
        materials.forEach(material => {
            // Add new rods
            if (material.rods_used && material.rods_used.length > 0) {
                material.rods_used.forEach((rod, rodIndex) => {
                    const pieces = rod.filter(piece => piece.length > 0);
                    const leftover = rodIndex < material.leftovers.length ? material.leftovers[rodIndex] : 0;
                    
                    if (pieces.length > 0) {
                        allRods.push({
                            pieces,
                            leftover,
                            type: 'new'
                        });
                    }
                });
            }
            
            // Track reused material
            if (material.reused_material && material.reused_material.length > 0) {
                material.reused_material.forEach(piece => {
                    if (piece.length > 0) {
                        totalReusedLength += piece.length;
                    }
                });
            }
        });
        
        // Add cutting diagram section
        let cuttingDiagramHtml = `<div class="cutting-section">
            <h4 class="cutting-section-title">Rod Cutting Details</h4>`;
        
        if (allRods.length > 0) {
            allRods.forEach((rod, rodIndex) => {
                cuttingDiagramHtml += `
                    <div class="rod-container">
                        <div class="rod-title">
                            Rod ${rodIndex + 1}
                        </div>
                `;
                
                // Add visual representation of rod
                cuttingDiagramHtml += `<div class="rod-visual">`;
                
                let currentPosition = 0;
                
                // Add pieces
                rod.pieces.forEach(piece => {
                    const pieceWidth = (piece.length / rodLength) * 100;
                    cuttingDiagramHtml += `
                        <div class="rod-piece new" style="left: ${currentPosition}%; width: ${pieceWidth}%;" title="${piece.length.toFixed(2)} ft">
                            ${piece.length.toFixed(1)}
                        </div>
                    `;
                    currentPosition += pieceWidth;
                });
                
                // Add leftover if any
                if (rod.leftover > 0) {
                    const leftoverWidth = (rod.leftover / rodLength) * 100;
                    cuttingDiagramHtml += `
                        <div class="rod-piece leftover" style="left: ${currentPosition}%; width: ${leftoverWidth}%;" title="Leftover: ${rod.leftover.toFixed(2)} ft">
                            ${rod.leftover.toFixed(1)}
                        </div>
                    `;
                }
                
                cuttingDiagramHtml += `</div>`; // Close rod-visual
                cuttingDiagramHtml += `</div>`; // Close rod-container
            });
        } else {
            cuttingDiagramHtml += `<p>No new rods used for this material.</p>`;
        }
        
        cuttingDiagramHtml += `</div>`;
        
        // Part of the displayResults function that deals with reused material
        if (totalReusedLength > 0) {
            cuttingDiagramHtml += `
                <div class="cutting-section">
                    <h4 class="cutting-section-title">Reused Material</h4>
            `;
            
            // Group reused pieces by source
            materials.forEach(material => {
                if (material.reused_material && material.reused_material.length > 0) {
                    // Organize reused material by source
                    const reusedBySource = {};
                    
                    material.reused_material.forEach((piece, idx) => {
                        const sourceIndex = material.reused_sources ? material.reused_sources[idx] : idx;
                        const source = `Leftover ${sourceIndex + 1}`;
                        
                        if (!reusedBySource[source]) {
                            reusedBySource[source] = [];
                        }
                        reusedBySource[source].push(piece);
                    });
                    
                    // Create visualization for each source
                    Object.entries(reusedBySource).forEach(([source, pieces]) => {
                        const sourceLength = pieces.reduce((sum, piece) => sum + piece.length, 0);
                        
                        cuttingDiagramHtml += `
                            <div class="reused-container">
                                <div class="rod-title">
                                    ${source} - ${sourceLength.toFixed(2)} ft used
                                </div>
                                <div class="rod-visual">
                        `;
                        
                        let currentPosition = 0;
                        
                        // Add pieces to visualization
                        pieces.forEach(piece => {
                            const pieceWidth = (piece.length / Math.max(sourceLength, 5)) * 100;
                            cuttingDiagramHtml += `
                                <div class="rod-piece reused" style="left: ${currentPosition}%; width: ${pieceWidth}%;" title="${piece.length.toFixed(2)} ft">
                                    ${piece.length.toFixed(1)}
                                </div>
                            `;
                            currentPosition += pieceWidth;
                        });
                        
                        cuttingDiagramHtml += `</div></div>`;
                    });
                } else {
                    cuttingDiagramHtml += `<p>Reused material information not available for detailed visualization.</p>`;
                }
            });
            
            cuttingDiagramHtml += `</div>`;
        }
    //     // Add reused material section if any
    //     if (totalReusedLength > 0) {
    //         cuttingDiagramHtml += `
    //             <div class="cutting-section">
    //                 <h4 class="cutting-section-title">Reused Material</h4>
    //         `;
            
    //         // Group reused pieces by source if available
    //         const material = materials[0]; // Use the first material since they all share the same code
    //         if (material.reused_material && material.reused_material.length > 0) {
    //             // Check if we have source information
    //             const hasSources = material.reused_sources || material.reused_material.some(piece => piece.source);
                
    //             if (hasSources) {
    //                 const reusedBySource = {};
                    
    //                 material.reused_material.forEach((piece, idx) => {
    //                     const source = piece.source || 
    //                                   (material.reused_sources ? `Leftover ${material.reused_sources[idx] + 1}` : "Unknown");
                        
    //                     if (!reusedBySource[source]) {
    //                         reusedBySource[source] = [];
    //                     }
    //                     reusedBySource[source].push(piece);
    //                 });
                    
    //                 // Create visualization for each source
    //                 Object.entries(reusedBySource).forEach(([source, pieces]) => {
    //                     const sourceLength = pieces.reduce((sum, piece) => sum + piece.length, 0);
                        
    //                     cuttingDiagramHtml += `
    //                         <div class="reused-container">
    //                             <div class="rod-title">
    //                                 ${source} - ${sourceLength.toFixed(2)} ft used
    //                             </div>
    //                             <div class="rod-visual">
    //                     `;
                        
    //                     // Calculate total length for this source to determine scale
    //                     const totalSourceLength = sourceLength;
    //                     let currentPosition = 0;
                        
    //                     // Add pieces
    //                     pieces.forEach(piece => {
    //                         const pieceWidth = (piece.length / Math.max(totalSourceLength, 5)) * 100;
    //                         cuttingDiagramHtml += `
    //                             <div class="rod-piece reused" style="left: ${currentPosition}%; width: ${pieceWidth}%;" title="${piece.length.toFixed(2)} ft">
    //                                 ${piece.length.toFixed(1)}
    //                             </div>
    //                         `;
    //                         currentPosition += pieceWidth;
    //                     });
                        
    //                     cuttingDiagramHtml += `</div></div>`;
    //                 });
    //             } else {
    //                 // Fallback for when we don't have source information
    //                 // Fallback for when we don't have source information
    //                 cuttingDiagramHtml += `
    //                     <div class="rod-pieces">
    //                         ${material.reused_material.map(piece => 
    //                             `<div class="piece reused">${piece.length.toFixed(2)} ft</div>`
    //                         ).join('')}
    //                     </div>
    //                 `;
    //             }
    //         }
            
    //         cuttingDiagramHtml += `</div>`;
    //     }
        
        materialCard.innerHTML += cuttingDiagramHtml;
        materialCard.innerHTML += `</div>`; // Close cutting-diagram
        
        materialDetailsContainer.appendChild(materialCard);
    });
    
    // Display leftovers section if any
    if (Object.keys(results.available_leftovers).length > 0) {
        const leftoversSection = document.createElement('div');
        leftoversSection.className = 'material-card';
        
        let leftoversHtml = `
            <div class="material-header">
                <div class="material-title">Available Leftovers</div>
            </div>
            <div class="leftover-details">
        `;
        
        Object.entries(results.available_leftovers).forEach(([materialCode, leftovers]) => {
            if (leftovers.length > 0) {
                leftoversHtml += `
                    <div class="leftover-group">
                        <h4>${materialCode}</h4>
                        <div class="rod-pieces">
                            ${leftovers.map(l => 
                                `<div class="piece leftover">${l.toFixed(2)} ft</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        leftoversHtml += '</div>';
        leftoversSection.innerHTML = leftoversHtml;
        materialDetailsContainer.appendChild(leftoversSection);
    }
}