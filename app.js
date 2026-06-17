/**
 * 3D Cost Studio - Core Logic File
 * Handles state management, DOM manipulation, cost calculations, and PDF generation.
 */

// ==========================================================================
// CONSTANTS & SEED DATA
// ==========================================================================

const LOCAL_STORAGE_KEY = '3d_cost_studio_state';

const DEFAULT_FILAMENTS = [
    { id: 'fil-1', name: 'PLA Genérico (Creality / Esun)', type: 'PLA', weight: 1000, price: 22000 },
    { id: 'fil-2', name: 'PETG Premium (eSUN)', type: 'PETG', weight: 1000, price: 27000 },
    { id: 'fil-3', name: 'TPU Flexible (SainSmart)', type: 'TPU', weight: 800, price: 35000 },
    { id: 'fil-4', name: 'ABS Resistente', type: 'ABS', weight: 1000, price: 24000 }
];

const DEFAULT_PRINTERS = [
    { id: 'prn-1', name: 'Creality Ender 3 V2', power: 350, cost: 320000, lifetime: 2000, overrideDepr: false, overrideDeprVal: 0 },
    { id: 'prn-2', name: 'Bambu Lab P1S', power: 350, cost: 950000, lifetime: 4000, overrideDepr: false, overrideDeprVal: 0 },
    { id: 'prn-3', name: 'Prusa i3 MK4', power: 300, cost: 1200000, lifetime: 5000, overrideDepr: false, overrideDeprVal: 0 }
];

const DEFAULT_SETTINGS = {
    electricityCost: 80.00,     // Pesos per kWh
    laborRate: 4500.00,         // Pesos per hour (prep)
    postLaborRate: 5000.00,     // Pesos per hour (post-processing)
    failMargin: 10,            // % default fail rate
    profitMargin: 50           // % default profit markup
};

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================

let state = {
    filaments: [],
    printers: [],
    settings: {}
};

// ==========================================================================
// FORMATTING HELPERS
// ==========================================================================

function formatNumber(val, decimals = 0) {
    return Intl.NumberFormat('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
}

function formatCurrency(val) {
    return '$ ' + formatNumber(Math.round(val), 0);
}

function formatDepreciation(val) {
    return '$ ' + Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
}

function formatWeight(val) {
    return Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(val);
}

/**
 * Loads state from localStorage, or seeds default data if empty.
 */
function loadState() {
    try {
        const rawState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (rawState) {
            const parsed = JSON.parse(rawState);
            // Ensure all keys exist
            state.filaments = parsed.filaments || [];
            state.printers = parsed.printers || [];
            state.settings = parsed.settings || {};
            
            // Seed if empty
            if (state.filaments.length === 0 && state.printers.length === 0) {
                seedDatabase();
            }
        } else {
            seedDatabase();
        }
    } catch (e) {
        console.error('Error loading localStorage state. Seeding defaults.', e);
        seedDatabase();
    }
}

/**
 * Saves current state to localStorage.
 */
function saveState() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save state to localStorage:', e);
        alert('Error al guardar datos. Puede que el almacenamiento del navegador esté lleno.');
    }
}

/**
 * Seeds localStorage with default values.
 */
function seedDatabase() {
    state.filaments = [...DEFAULT_FILAMENTS];
    state.printers = [...DEFAULT_PRINTERS];
    state.settings = { ...DEFAULT_SETTINGS };
    saveState();
}

// ==========================================================================
// DOM ELEMENTS & INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTheme();
    initTabs();
    initCalculatorForm();
    initSettingsForm();
    initModals();
    
    // Initial renders
    populateDropdowns();
    renderFilamentsList();
    renderPrintersList();
    populateSettingsForm();
    
    // Initial run of calculations
    calculateCosts();
});

// ==========================================================================
// THEME SWITCHER
// ==========================================================================

function initTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// ==========================================================================
// TAB NAVIGATION
// ==========================================================================

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active classes
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active classes
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // If returning to calculator, ensure select menus and values are synced
            if (targetTab === 'tab-calculator') {
                populateDropdowns();
                calculateCosts();
            }
        });
    });
}

// ==========================================================================
// CALCULATOR CORE ENGINE
// ==========================================================================

function initCalculatorForm() {
    const form = document.getElementById('calc-form');
    const resetBtn = document.getElementById('btn-reset-calc');
    const exportBtn = document.getElementById('btn-export-pdf');
    const overrideCheckbox = document.getElementById('calc-override-depr');
    const overrideValGroup = document.getElementById('calc-override-value-group');
    
    // Sliders update text labels
    const failRange = document.getElementById('calc-margin-fail');
    const failVal = document.getElementById('val-margin-fail');
    const profitRange = document.getElementById('calc-margin-profit');
    const profitVal = document.getElementById('val-margin-profit');
    
    failRange.addEventListener('input', (e) => {
        failVal.textContent = e.target.value;
        calculateCosts();
    });
    
    profitRange.addEventListener('input', (e) => {
        profitVal.textContent = e.target.value;
        calculateCosts();
    });
    
    // Toggle manual override input visibility
    overrideCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            overrideValGroup.style.display = 'block';
        } else {
            overrideValGroup.style.display = 'none';
        }
        calculateCosts();
    });
    
    // Event listeners for real-time calculations on all input changes
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calculateCosts);
        input.addEventListener('change', calculateCosts);
    });
    
    // Reset button
    resetBtn.addEventListener('click', () => {
        form.reset();
        overrideValGroup.style.display = 'none';
        
        // Reset slider text indicators
        failVal.textContent = state.settings.failMargin || DEFAULT_SETTINGS.failMargin;
        profitVal.textContent = state.settings.profitMargin || DEFAULT_SETTINGS.profitMargin;
        
        // Re-set sliders to settings default values
        failRange.value = state.settings.failMargin || DEFAULT_SETTINGS.failMargin;
        profitRange.value = state.settings.profitMargin || DEFAULT_SETTINGS.profitMargin;
        
        calculateCosts();
    });
    
    // Export PDF button
    exportBtn.addEventListener('click', exportToPDF);
}

/**
 * Populates dropdown menus in the calculator with saved filaments and printers.
 */
function populateDropdowns() {
    const filamentSelect = document.getElementById('calc-filament');
    const printerSelect = document.getElementById('calc-printer');
    
    // Save selected values to preserve selections if dropdowns reload
    const prevFilament = filamentSelect.value;
    const prevPrinter = printerSelect.value;
    
    filamentSelect.innerHTML = '';
    printerSelect.innerHTML = '';
    
    // Filaments
    state.filaments.forEach(fil => {
        const opt = document.createElement('option');
        opt.value = fil.id;
        opt.textContent = `${fil.name} (${fil.type}) - ${formatCurrency(fil.price)}/kg`;
        filamentSelect.appendChild(opt);
    });
    
    // Printers
    state.printers.forEach(prn => {
        const opt = document.createElement('option');
        opt.value = prn.id;
        
        const deprHour = prn.overrideDepr ? prn.overrideDeprVal : (prn.cost / prn.lifetime);
        opt.textContent = `${prn.name} (${prn.power}W) - ${formatDepreciation(deprHour)}/h`;
        printerSelect.appendChild(opt);
    });
    
    // Restore selection if they still exist in the updated state
    if (state.filaments.some(f => f.id === prevFilament)) {
        filamentSelect.value = prevFilament;
    }
    if (state.printers.some(p => p.id === prevPrinter)) {
        printerSelect.value = prevPrinter;
    }
}

// Global variable storing the latest calculation results for PDF generation
let lastCalculatedData = null;

/**
 * Evaluates the cost equations and updates the DOM in real-time.
 */
function calculateCosts() {
    const filamentId = document.getElementById('calc-filament').value;
    const weightVal = parseFloat(document.getElementById('calc-weight').value) || 0;
    const printerId = document.getElementById('calc-printer').value;
    const hoursVal = parseFloat(document.getElementById('calc-time-hours').value) || 0;
    const minutesVal = parseFloat(document.getElementById('calc-time-minutes').value) || 0;
    const prepTimeVal = parseFloat(document.getElementById('calc-prep-time').value) || 0;
    const postTimeVal = parseFloat(document.getElementById('calc-post-time').value) || 0;
    const postFixedVal = parseFloat(document.getElementById('calc-post-fixed').value) || 0;
    
    // New batch fields
    const qtyVal = Math.max(1, parseInt(document.getElementById('calc-qty').value) || 1);
    const piecesBedVal = Math.max(1, parseInt(document.getElementById('calc-pieces-bed').value) || 1);
    const wasteBedVal = parseFloat(document.getElementById('calc-waste-bed').value) || 0;
    const timeModeVal = document.getElementById('calc-time-mode').value;
    
    const failMarginPct = parseFloat(document.getElementById('calc-margin-fail').value) || 0;
    const profitMarginPct = parseFloat(document.getElementById('calc-margin-profit').value) || 0;
    
    const overrideCheckbox = document.getElementById('calc-override-depr').checked;
    const overrideVal = parseFloat(document.getElementById('calc-override-depr-val').value) || 0;
    
    // Fetch profiles from state
    const filament = state.filaments.find(f => f.id === filamentId);
    const printer = state.printers.find(p => p.id === printerId);
    
    // If no profiles exist, cancel calculations
    if (!filament || !printer) {
        updateResultsDOM({
            filamentCost: 0,
            printerDeprCost: 0,
            electricityCost: 0,
            laborCost: 0,
            postProcessCost: 0,
            subtotal: 0,
            failCost: 0,
            profitMarkup: 0,
            totalPrice: 0,
            unitPrice: 0,
            profitPerUnit: 0,
            bedsNeeded: 1
        });
        return;
    }
    
    // Bed / batch count calculation
    const bedsNeeded = Math.ceil(qtyVal / piecesBedVal);
    
    // Filament used: piece weight * total qty + waste per bed * beds needed
    const totalWeightVal = (weightVal * qtyVal) + (wasteBedVal * bedsNeeded);
    const filamentCost = (totalWeightVal / filament.weight) * filament.price;
    
    // Printing Time calculation (Hours)
    const printTimeInHours = hoursVal + (minutesVal / 60);
    let totalPrintTimeInHours = 0;
    if (timeModeVal === 'piece') {
        totalPrintTimeInHours = printTimeInHours * qtyVal;
    } else { // 'bed'
        totalPrintTimeInHours = printTimeInHours * bedsNeeded;
    }
    
    // Printer wear & depreciation
    let deprRatePerHour = printer.overrideDepr ? printer.overrideDeprVal : (printer.cost / printer.lifetime);
    if (overrideCheckbox) {
        deprRatePerHour = overrideVal;
    }
    const printerDeprCost = deprRatePerHour * totalPrintTimeInHours;
    
    // Electricity Cost
    const powerKw = printer.power / 1000;
    const electricityCost = powerKw * totalPrintTimeInHours * state.settings.electricityCost;
    
    // Labor Cost (Prep/design is a fixed cost per project)
    const laborCost = prepTimeVal * state.settings.laborRate;
    
    // Post-processing Cost (Entered as total for the batch/project)
    const postProcessCost = postFixedVal + (postTimeVal * state.settings.postLaborRate);
    
    // Subtotal (Production Cost)
    const subtotal = filamentCost + printerDeprCost + electricityCost + laborCost + postProcessCost;
    
    // Margins
    const failCost = subtotal * (failMarginPct / 100);
    const profitMarkup = (subtotal + failCost) * (profitMarginPct / 100);
    
    // Suggested Retail Price (Sum of rounded values to avoid rounding mismatches in UI/PDF)
    const totalPrice = Math.round(subtotal) + Math.round(failCost) + Math.round(profitMarkup);
    const unitPrice = totalPrice / qtyVal;
    const profitPerUnit = profitMarkup / qtyVal;
    
    // Keep record of latest calculation parameters
    lastCalculatedData = {
        filament,
        weightVal,
        printer,
        printTimeInHours,
        totalPrintTimeInHours,
        hoursVal,
        minutesVal,
        prepTimeVal,
        postTimeVal,
        postFixedVal,
        failMarginPct,
        profitMarginPct,
        qtyVal,
        piecesBedVal,
        wasteBedVal,
        timeModeVal,
        bedsNeeded,
        totalWeightVal,
        filamentCost,
        printerDeprCost,
        electricityCost,
        laborCost,
        postProcessCost,
        subtotal,
        failCost,
        profitMarkup,
        totalPrice,
        unitPrice,
        profitPerUnit
    };
    
    updateResultsDOM(lastCalculatedData);
}

/**
 * Updates DOM outputs and bar graphs with calculated data.
 */
function updateResultsDOM(data) {
    // Labels
    document.getElementById('res-total').textContent = formatCurrency(data.totalPrice);
    document.getElementById('res-subtotal').textContent = formatCurrency(data.subtotal);
    document.getElementById('res-falla-cost').textContent = formatCurrency(data.failCost);
    document.getElementById('res-ganancia-cost').textContent = formatCurrency(data.profitMarkup);
    document.getElementById('res-ganancia-unit').textContent = formatCurrency(data.profitPerUnit);
    
    // New sub metrics
    document.getElementById('res-unit-price').textContent = formatCurrency(data.unitPrice);
    document.getElementById('res-beds-needed').textContent = data.bedsNeeded;
    
    // Breakdown items
    document.getElementById('res-cost-filament').textContent = formatCurrency(data.filamentCost);
    document.getElementById('res-cost-printer').textContent = formatCurrency(data.printerDeprCost);
    document.getElementById('res-cost-electricity').textContent = formatCurrency(data.electricityCost);
    document.getElementById('res-cost-labor').textContent = formatCurrency(data.laborCost);
    document.getElementById('res-cost-post').textContent = formatCurrency(data.postProcessCost);
    
    // Progress Bars: Calculate ratio against subtotal (capped at 100% or 0 if subtotal is 0)
    const sub = data.subtotal || 1; // avoid divide by zero
    const pctFilament = (data.filamentCost / sub) * 100;
    const pctPrinter = (data.printerDeprCost / sub) * 100;
    const pctElectricity = (data.electricityCost / sub) * 100;
    const pctLabor = (data.laborCost / sub) * 100;
    const pctPost = (data.postProcessCost / sub) * 100;
    
    document.getElementById('bar-filament').style.width = `${data.subtotal > 0 ? pctFilament : 0}%`;
    document.getElementById('bar-printer').style.width = `${data.subtotal > 0 ? pctPrinter : 0}%`;
    document.getElementById('bar-electricity').style.width = `${data.subtotal > 0 ? pctElectricity : 0}%`;
    document.getElementById('bar-labor').style.width = `${data.subtotal > 0 ? pctLabor : 0}%`;
    document.getElementById('bar-post').style.width = `${data.subtotal > 0 ? pctPost : 0}%`;
}

// ==========================================================================
// FILAMENTS MANAGEMENT (TAB & CRUD)
// ==========================================================================

function renderFilamentsList() {
    const container = document.getElementById('filaments-container');
    container.innerHTML = '';
    
    state.filaments.forEach(fil => {
        const card = document.createElement('div');
        card.className = 'card glass profile-card';
        card.innerHTML = `
            <h3>${fil.name}</h3>
            <span class="profile-type">${fil.type}</span>
            <div class="profile-details">
                <span>Costo del Rollo: <strong>${formatCurrency(fil.price)}</strong></span>
                <span>Peso del Rollo: <strong>${fil.weight}g</strong></span>
                <span>Costo por gramo: <strong>${formatDepreciation(fil.price / fil.weight)}</strong></span>
            </div>
            <div class="profile-actions">
                <button class="icon-btn edit-fil-btn" data-id="${fil.id}" title="Editar">
                    <svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
                </button>
                <button class="icon-btn delete-fil-btn" data-id="${fil.id}" title="Eliminar">
                    <svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Attach event listeners to newly rendered buttons
    document.querySelectorAll('.edit-fil-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            openFilamentModal(id);
        });
    });
    
    document.querySelectorAll('.delete-fil-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            deleteFilament(id);
        });
    });
}

function openFilamentModal(id = null) {
    const modal = document.getElementById('modal-filament');
    const form = document.getElementById('modal-filament-form');
    const title = document.getElementById('modal-filament-title');
    
    form.reset();
    
    if (id) {
        title.textContent = 'Editar Filamento';
        const fil = state.filaments.find(f => f.id === id);
        if (fil) {
            document.getElementById('modal-filament-id').value = fil.id;
            document.getElementById('modal-filament-name').value = fil.name;
            document.getElementById('modal-filament-type').value = fil.type;
            document.getElementById('modal-filament-weight').value = fil.weight;
            document.getElementById('modal-filament-price').value = fil.price;
        }
    } else {
        title.textContent = 'Añadir Filamento';
        document.getElementById('modal-filament-id').value = '';
    }
    
    modal.classList.add('active');
}

function closeFilamentModal() {
    document.getElementById('modal-filament').classList.remove('active');
}

function saveFilament(e) {
    e.preventDefault();
    const id = document.getElementById('modal-filament-id').value;
    const name = document.getElementById('modal-filament-name').value.trim();
    const type = document.getElementById('modal-filament-type').value;
    const weight = parseFloat(document.getElementById('modal-filament-weight').value) || 1000;
    const price = parseFloat(document.getElementById('modal-filament-price').value) || 0;
    
    if (!name) {
        alert('Por favor ingresa un nombre válido.');
        return;
    }
    
    if (id) {
        // Edit existing
        const index = state.filaments.findIndex(f => f.id === id);
        if (index !== -1) {
            state.filaments[index] = { id, name, type, weight, price };
        }
    } else {
        // Create new
        const newId = 'fil-' + Date.now();
        state.filaments.push({ id: newId, name, type, weight, price });
    }
    
    saveState();
    closeFilamentModal();
    renderFilamentsList();
    populateDropdowns();
}

function deleteFilament(id) {
    const fil = state.filaments.find(f => f.id === id);
    if (!fil) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar el filamento "${fil.name}"?`)) {
        state.filaments = state.filaments.filter(f => f.id !== id);
        saveState();
        renderFilamentsList();
        populateDropdowns();
    }
}

// ==========================================================================
// PRINTERS MANAGEMENT (TAB & CRUD)
// ==========================================================================

function renderPrintersList() {
    const container = document.getElementById('printers-container');
    container.innerHTML = '';
    
    state.printers.forEach(prn => {
        const deprHour = prn.overrideDepr ? prn.overrideDeprVal : (prn.cost / prn.lifetime);
        const card = document.createElement('div');
        card.className = 'card glass profile-card';
        card.innerHTML = `
            <h3>${prn.name}</h3>
            <span class="profile-type">${prn.power} W</span>
            <div class="profile-details">
                <span>Costo de Compra: <strong>${formatCurrency(prn.cost)}</strong></span>
                <span>Vida útil estimada: <strong>${prn.lifetime} horas</strong></span>
                <span>Costo de depreciación: <strong>${formatDepreciation(deprHour)} / hora</strong> ${prn.overrideDepr ? '<em style="font-size:11px;color:var(--primary);">(Tarifa Fija)</em>' : ''}</span>
            </div>
            <div class="profile-actions">
                <button class="icon-btn edit-prn-btn" data-id="${prn.id}" title="Editar">
                    <svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
                </button>
                <button class="icon-btn delete-prn-btn" data-id="${prn.id}" title="Eliminar">
                    <svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Attach events
    document.querySelectorAll('.edit-prn-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            openPrinterModal(id);
        });
    });
    
    document.querySelectorAll('.delete-prn-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            deletePrinter(id);
        });
    });
}

function openPrinterModal(id = null) {
    const modal = document.getElementById('modal-printer');
    const form = document.getElementById('modal-printer-form');
    const title = document.getElementById('modal-printer-title');
    const deprPreview = document.getElementById('modal-depr-calc-preview');
    const overrideCheckbox = document.getElementById('modal-printer-override-depr');
    const overrideValGroup = document.getElementById('modal-printer-override-val-group');
    
    form.reset();
    overrideValGroup.style.display = 'none';
    deprPreview.textContent = '$0.00 / hora de uso';
    
    // Realtime preview calculation in modal
    const costInput = document.getElementById('modal-printer-cost');
    const lifetimeInput = document.getElementById('modal-printer-lifetime');
    
    const updateModalDeprPreview = () => {
        const cost = parseFloat(costInput.value) || 0;
        const lifetime = parseFloat(lifetimeInput.value) || 0;
        if (lifetime > 0) {
            deprPreview.textContent = `${formatDepreciation(cost / lifetime)} / hora de uso`;
        } else {
            deprPreview.textContent = '$ 0 / hora de uso';
        }
    };
    
    costInput.addEventListener('input', updateModalDeprPreview);
    lifetimeInput.addEventListener('input', updateModalDeprPreview);
    
    overrideCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            overrideValGroup.style.display = 'block';
        } else {
            overrideValGroup.style.display = 'none';
        }
    });
    
    if (id) {
        title.textContent = 'Editar Impresora';
        const prn = state.printers.find(p => p.id === id);
        if (prn) {
            document.getElementById('modal-printer-id').value = prn.id;
            document.getElementById('modal-printer-name').value = prn.name;
            document.getElementById('modal-printer-power').value = prn.power;
            document.getElementById('modal-printer-cost').value = prn.cost;
            document.getElementById('modal-printer-lifetime').value = prn.lifetime;
            
            overrideCheckbox.checked = prn.overrideDepr || false;
            if (prn.overrideDepr) {
                overrideValGroup.style.display = 'block';
                document.getElementById('modal-printer-override-val').value = prn.overrideDeprVal;
            }
            updateModalDeprPreview();
        }
    } else {
        title.textContent = 'Añadir Impresora';
        document.getElementById('modal-printer-id').value = '';
    }
    
    modal.classList.add('active');
}

function closePrinterModal() {
    document.getElementById('modal-printer').classList.remove('active');
}

function savePrinter(e) {
    e.preventDefault();
    const id = document.getElementById('modal-printer-id').value;
    const name = document.getElementById('modal-printer-name').value.trim();
    const power = parseFloat(document.getElementById('modal-printer-power').value) || 350;
    const cost = parseFloat(document.getElementById('modal-printer-cost').value) || 0;
    const lifetime = parseFloat(document.getElementById('modal-printer-lifetime').value) || 2000;
    const overrideDepr = document.getElementById('modal-printer-override-depr').checked;
    const overrideDeprVal = parseFloat(document.getElementById('modal-printer-override-val').value) || 0;
    
    if (!name) {
        alert('Por favor ingresa un nombre/modelo válido.');
        return;
    }
    
    if (id) {
        // Edit existing
        const index = state.printers.findIndex(p => p.id === id);
        if (index !== -1) {
            state.printers[index] = { id, name, power, cost, lifetime, overrideDepr, overrideDeprVal };
        }
    } else {
        // Create new
        const newId = 'prn-' + Date.now();
        state.printers.push({ id: newId, name, power, cost, lifetime, overrideDepr, overrideDeprVal });
    }
    
    saveState();
    closePrinterModal();
    renderPrintersList();
    populateDropdowns();
}

function deletePrinter(id) {
    const prn = state.printers.find(p => p.id === id);
    if (!prn) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar la impresora "${prn.name}"?`)) {
        state.printers = state.printers.filter(p => p.id !== id);
        saveState();
        renderPrintersList();
        populateDropdowns();
    }
}

// ==========================================================================
// SETTINGS MANAGEMENT (TAB)
// ==========================================================================

function populateSettingsForm() {
    document.getElementById('set-electricity').value = state.settings.electricityCost;
    document.getElementById('set-labor').value = state.settings.laborRate;
    document.getElementById('set-post-labor').value = state.settings.postLaborRate;
    document.getElementById('set-margin-fail').value = state.settings.failMargin;
    document.getElementById('set-margin-profit').value = state.settings.profitMargin;
}

function initSettingsForm() {
    const form = document.getElementById('settings-form');
    const resetDbBtn = document.getElementById('btn-reset-db');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        state.settings.electricityCost = parseFloat(document.getElementById('set-electricity').value) || 0;
        state.settings.laborRate = parseFloat(document.getElementById('set-labor').value) || 0;
        state.settings.postLaborRate = parseFloat(document.getElementById('set-post-labor').value) || 0;
        state.settings.failMargin = parseFloat(document.getElementById('set-margin-fail').value) || 0;
        state.settings.profitMargin = parseFloat(document.getElementById('set-margin-profit').value) || 0;
        
        saveState();
        
        // Update quick sliders in calculator form as well
        document.getElementById('calc-margin-fail').value = state.settings.failMargin;
        document.getElementById('val-margin-fail').textContent = state.settings.failMargin;
        document.getElementById('calc-margin-profit').value = state.settings.profitMargin;
        document.getElementById('val-margin-profit').textContent = state.settings.profitMargin;
        
        alert('Ajustes guardados correctamente.');
        calculateCosts();
    });
    
    resetDbBtn.addEventListener('click', () => {
        if (confirm('¡Cuidado! Esto eliminará permanentemente todos tus filamentos e impresoras personalizadas y restablecerá los valores semilla por defecto. ¿Quieres continuar?')) {
            seedDatabase();
            loadState();
            populateDropdowns();
            renderFilamentsList();
            renderPrintersList();
            populateSettingsForm();
            
            // Sync quick sliders in calc
            document.getElementById('calc-margin-fail').value = state.settings.failMargin;
            document.getElementById('val-margin-fail').textContent = state.settings.failMargin;
            document.getElementById('calc-margin-profit').value = state.settings.profitMargin;
            document.getElementById('val-margin-profit').textContent = state.settings.profitMargin;
            
            alert('Base de datos restablecida correctamente.');
            calculateCosts();
        }
    });
}

// ==========================================================================
// MODALS LOGIC
// ==========================================================================

function initModals() {
    // Buttons to open modals
    const openFilBtn = document.getElementById('btn-add-filament-modal');
    const openPrnBtn = document.getElementById('btn-add-printer-modal');
    const quickAddFilBtn = document.getElementById('quick-add-filament-btn');
    const quickAddPrnBtn = document.getElementById('quick-add-printer-btn');
    
    // Cancel / Close buttons
    const cancelFilBtn = document.getElementById('btn-cancel-filament');
    const cancelPrnBtn = document.getElementById('btn-cancel-printer');
    const closeFilModal = document.getElementById('btn-close-filament-modal');
    const closePrnModal = document.getElementById('btn-close-printer-modal');
    
    // Event listeners opening
    openFilBtn.addEventListener('click', () => openFilamentModal());
    openPrnBtn.addEventListener('click', () => openPrinterModal());
    quickAddFilBtn.addEventListener('click', () => openFilamentModal());
    quickAddPrnBtn.addEventListener('click', () => openPrinterModal());
    
    // Event listeners closing
    cancelFilBtn.addEventListener('click', closeFilamentModal);
    cancelPrnBtn.addEventListener('click', closePrinterModal);
    closeFilModal.addEventListener('click', closeFilamentModal);
    closePrnModal.addEventListener('click', closePrinterModal);
    
    // Form submissions
    document.getElementById('modal-filament-form').addEventListener('submit', saveFilament);
    document.getElementById('modal-printer-form').addEventListener('submit', savePrinter);
    
    // Click outside modal content closes modal
    window.addEventListener('click', (e) => {
        const filModal = document.getElementById('modal-filament');
        const prnModal = document.getElementById('modal-printer');
        if (e.target === filModal) closeFilamentModal();
        if (e.target === prnModal) closePrinterModal();
    });
}

// ==========================================================================
// PDF EXPORT (html2pdf.js)
// ==========================================================================

function exportToPDF() {
    if (!lastCalculatedData) {
        alert('Por favor calcula los costos antes de exportar.');
        return;
    }
    
    const d = lastCalculatedData;
    
    // Fill the hidden template on the page with calculated values
    document.getElementById('pdf-date').textContent = new Date().toLocaleDateString();
    
    document.getElementById('pdf-filament-name').textContent = d.filament.name;
    document.getElementById('pdf-weight').textContent = formatWeight(d.weightVal);
    document.getElementById('pdf-printer-name').textContent = d.printer.name;
    document.getElementById('pdf-time-mode').textContent = d.timeModeVal === 'piece' ? 'Por Pieza' : 'Por Cama';
    
    // Batch values
    document.getElementById('pdf-qty').textContent = d.qtyVal;
    document.getElementById('pdf-pieces-bed').textContent = d.piecesBedVal;
    document.getElementById('pdf-beds-needed').textContent = d.bedsNeeded;
    document.getElementById('pdf-waste-bed').textContent = formatWeight(d.wasteBedVal);
    
    // Print time formatting (total job time)
    const hTotal = Math.floor(d.totalPrintTimeInHours);
    const mTotal = Math.round((d.totalPrintTimeInHours - hTotal) * 60);
    document.getElementById('pdf-time').textContent = `${hTotal}h ${mTotal}m`;
    
    document.getElementById('pdf-prep-time').textContent = formatWeight(d.prepTimeVal);
    document.getElementById('pdf-post-time').textContent = formatWeight(d.postTimeVal);
    document.getElementById('pdf-post-fixed').textContent = formatNumber(d.postFixedVal, 0);
    
    // Table content
    document.getElementById('pdf-table-filament').textContent = formatCurrency(d.filamentCost);
    document.getElementById('pdf-table-printer').textContent = formatCurrency(d.printerDeprCost);
    document.getElementById('pdf-table-electricity').textContent = formatCurrency(d.electricityCost);
    document.getElementById('pdf-table-labor').textContent = formatCurrency(d.laborCost);
    document.getElementById('pdf-table-post').textContent = formatCurrency(d.postProcessCost);
    document.getElementById('pdf-table-subtotal').textContent = formatCurrency(d.subtotal);
    
    document.getElementById('pdf-fail-percent').textContent = d.failMarginPct;
    document.getElementById('pdf-table-fail').textContent = formatCurrency(d.failCost);
    
    document.getElementById('pdf-profit-percent').textContent = d.profitMarginPct;
    document.getElementById('pdf-table-profit').textContent = formatCurrency(d.profitMarkup);
    
    document.getElementById('pdf-unit-price').textContent = formatCurrency(d.unitPrice);
    document.getElementById('pdf-invoice-total').textContent = formatCurrency(d.totalPrice);
    
    // Trigger html2pdf export on the temporary elements
    const element = document.getElementById('pdf-invoice-template');
    
    // Temporarily make the template element visible to html2pdf (but off-screen or inline layout styled)
    // We clone it or change its style before rendering to keep it clean
    const pdfClone = element.cloneNode(true);
    pdfClone.style.position = 'static';
    pdfClone.style.left = '0';
    pdfClone.style.top = '0';
    
    const opt = {
        margin:       15,
        filename:     `cotizacion_impresion_3d_${Date.now()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Run html2pdf download
    html2pdf().from(pdfClone).set(opt).save().then(() => {
        console.log('PDF exported successfully');
    }).catch(err => {
        console.error('Error generating PDF:', err);
        alert('Error al generar el archivo PDF. Intente de nuevo.');
    });
}
