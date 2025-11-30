/**
 * FoodFit Frontend JavaScript
 * Handles all page logic, API calls, and user interactions
 */

const API_BASE_URL = 'https://foodfit-api.onrender.com';
// Storage keys for localStorage
const STORAGE_KEYS = {
    menuResponse: 'foodfit_menu_response',
    planType: 'foodfit_plan_type',
    lastOrder: 'foodfit_last_order',
};

/**
 * Save data to localStorage
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

/**
 * Read data from localStorage
 */
function readFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to read from localStorage:', e);
        return null;
    }
}

/**
 * Initialize plans page - save plan type from URL
 */
function initPlansPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const planType = urlParams.get('plan_type');
    if (planType) {
        saveToStorage(STORAGE_KEYS.planType, planType);
    }
}

/**
 * Initialize preferences page - load plan type and handle form submission
 */
function initPreferencesPage() {
    const form = document.getElementById('preferences-form');
    const statusBox = document.getElementById('status-box');
    const planTypeInput = document.getElementById('plan_type');

    // Load plan type from storage or URL
    const urlParams = new URLSearchParams(window.location.search);
    const planType = urlParams.get('plan_type') || readFromStorage(STORAGE_KEYS.planType) || 'weekly';
    if (planTypeInput) {
        planTypeInput.value = planType;
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (statusBox) {
            statusBox.innerHTML = '<div class="alert">Відправка даних...</div>';
        }

        const formData = new FormData(form);
        const payload = {
            user_name: formData.get('user_name'),
            calories: parseInt(formData.get('calories')),
            likes: formData.get('likes'),
            dislikes: formData.get('dislikes'),
            allergies: formData.get('allergies'),
            plan_type: formData.get('plan_type'),
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Не вдалося створити меню.');
            }

            saveToStorage(STORAGE_KEYS.menuResponse, data);
            saveToStorage(STORAGE_KEYS.planType, payload.plan_type);

            if (statusBox) {
                statusBox.innerHTML = '<div class="alert success">Меню збережено! Перенаправляємо на сторінку результату...</div>';
            }
            setTimeout(() => {
                window.location.href = 'menu.html';
            }, 800);
        } catch (error) {
            if (statusBox) {
                statusBox.innerHTML = `<div class="alert error">${error.message}</div>`;
            }
        }
    });
}

/**
 * Initialize menu page - render menu and snacks, handle interactions
 */
function initMenuPage() {
    const container = document.getElementById('menu-container');
    const summaryBox = document.getElementById('summary');
    const snacksContainer = document.getElementById('snack-list');
    const checkoutButton = document.getElementById('checkout-button');
    const orderStatus = document.getElementById('order-status');
    const planInfoBox = document.getElementById('plan-info');
    const daysTabs = document.getElementById('days-tabs');

    if (!container) return;

    const menuData = readFromStorage(STORAGE_KEYS.menuResponse);
    if (!menuData) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Меню ще не створене</h2>
                <p>Спочатку заповніть свої вподобання. Після цього ми згенеруємо індивідуальний план харчування.</p>
                <a class="btn" href="preferences.html">Заповнити вподобання</a>
            </div>
        `;
        return;
    }

    // Check if we have multiple days
    const days = Array.isArray(menuData.days) ? menuData.days : [];
    const daysCount = menuData.days_count || days.length || 1;
    const planType = menuData.plan_type || 'weekly';
    
    let currentDayIndex = 0;
    // Store selected snacks per day: { dayNumber: Map<snackId, snack> }
    const selectedSnacksByDay = new Map();
    const snacks = Array.isArray(menuData.snacks) ? menuData.snacks : [];
    
    // Initialize snacks storage for each day
    days.forEach(dayData => {
        if (!selectedSnacksByDay.has(dayData.day)) {
            selectedSnacksByDay.set(dayData.day, new Map());
        }
    });

    // Display plan info
    if (planInfoBox) {
        planInfoBox.innerHTML = `
            <div class="plan-info">
                <strong>План: ${planType === 'monthly' ? 'Місячний (30 днів)' : 'Тижневий (7 днів)'}</strong> | 
                Добова норма: ${menuData.requested_calories} ккал
            </div>
        `;
    }

    // Create day tabs
    if (daysTabs && days.length > 0) {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'days-tabs-container';
        
        days.forEach((dayData, index) => {
            const tab = document.createElement('button');
            tab.className = `day-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = `День ${dayData.day}`;
            tab.addEventListener('click', () => {
                currentDayIndex = index;
                updateDayDisplay();
                // Update active tab
            tabsContainer.querySelectorAll('.day-tab').forEach((t, i) => {
                t.classList.toggle('active', i === index);
            });
            // Update display when switching days
            updateDayDisplay();
        });
        tabsContainer.appendChild(tab);
    });
    
    daysTabs.appendChild(tabsContainer);
}

    function getCurrentDayData() {
        if (days.length > 0) {
            return days[currentDayIndex];
        }
        // Fallback for old format
        return {
            menu: menuData.menu || {},
            total_calories: menuData.total_menu_calories || 0,
            total_proteins: menuData.total_proteins || 0,
            total_fats: menuData.total_fats || 0,
            total_carbs: menuData.total_carbs || 0,
        };
    }

    function updateDayDisplay() {
        if (!container) return;
        
        container.innerHTML = '';
        const dayData = getCurrentDayData();
        const baseMeals = ['breakfast', 'lunch', 'dinner']
            .map(key => dayData.menu[key])
            .filter(Boolean);

        // Render meal cards for current day
        baseMeals.forEach(meal => {
            const card = createMealCard(meal);
            container.appendChild(card);
        });

        // Update snack cards for current day
        updateSnackCards();
        updateSummary();
    }

    function updateSnackCards() {
        if (!snacksContainer) return;
        
        snacksContainer.innerHTML = '';
        const dayData = getCurrentDayData();
        const currentDay = dayData.day || (days.length > 0 ? days[currentDayIndex].day : 1);
        const selectedSnacks = selectedSnacksByDay.get(currentDay) || new Map();
        
        snacks.forEach(snack => {
            const isSelected = selectedSnacks.has(snack.id);
            const card = createSnackCard(snack, selectedSnacks, currentDay, () => {
                updateSummary();
            }, isSelected);
            snacksContainer.appendChild(card);
        });
    }

    // Initial snack cards setup
    updateSnackCards();

    // Summary section
    function calculateTotalCalories() {
        const dayData = getCurrentDayData();
        const currentDay = dayData.day || (days.length > 0 ? days[currentDayIndex].day : 1);
        const selectedSnacks = selectedSnacksByDay.get(currentDay) || new Map();
        
        const baseMeals = ['breakfast', 'lunch', 'dinner']
            .map(key => dayData.menu[key])
            .filter(Boolean);
        const baseTotal = baseMeals.reduce((sum, meal) => sum + (meal?.calories || 0), 0);
        const snacksTotal = Array.from(selectedSnacks.values()).reduce(
            (sum, snack) => sum + (snack.calories || 0),
            0
        );
        return { baseTotal, snacksTotal, grandTotal: baseTotal + snacksTotal };
    }

    function updateSummary() {
        const { baseTotal, snacksTotal, grandTotal } = calculateTotalCalories();
        const target = menuData.requested_calories || baseTotal;
        const difference = grandTotal - target;
        const diffAbs = Math.abs(difference);
        
        const dayData = getCurrentDayData();
        let totalProteins = dayData.total_proteins || 0;
        let totalFats = dayData.total_fats || 0;
        let totalCarbs = dayData.total_carbs || 0;
        
        // Calculate target БЖВ (30% proteins, 30% fats, 40% carbs)
        const targetProteins = Math.round((target * 0.30) / 4);
        const targetFats = Math.round((target * 0.30) / 9);
        const targetCarbs = Math.round((target * 0.40) / 4);
        
        const proteinDiff = totalProteins - targetProteins;
        const fatDiff = totalFats - targetFats;
        const carbDiff = totalCarbs - targetCarbs;
        
        // Check if deviations are acceptable (within 10% for calories, 15% for macros)
        const calorieOk = diffAbs <= target * 0.10;
        const proteinOk = Math.abs(proteinDiff) <= targetProteins * 0.15;
        const fatOk = Math.abs(fatDiff) <= targetFats * 0.15;
        const carbOk = Math.abs(carbDiff) <= targetCarbs * 0.15;
        
        const allOk = calorieOk && proteinOk && fatOk && carbOk;
        
        const status = allOk
            ? `<span class="difference ok">✅ План у межах норми (калорії та БЖВ)</span>`
            : `<span class="difference warning">⚠️ Відхилення: ${difference > 0 ? '+' : ''}${diffAbs} ккал, Б: ${proteinDiff > 0 ? '+' : ''}${proteinDiff}г, Ж: ${fatDiff > 0 ? '+' : ''}${fatDiff}г, В: ${carbDiff > 0 ? '+' : ''}${carbDiff}г</span>`;

        if (summaryBox) {
            const dayNumber = days.length > 0 ? days[currentDayIndex].day : 1;
            summaryBox.innerHTML = `
                <div class="menu-summary">
                    <div style="width: 100%; margin-bottom: 0.5rem;">
                        <strong>День ${dayNumber} | Добова норма: ${target} ккал</strong> | 
                        Білки: ${targetProteins}г | Жири: ${targetFats}г | Вуглеводи: ${targetCarbs}г
                    </div>
                    <div style="width: 100%; margin-bottom: 0.5rem;">
                        <strong>Поточний план: ${grandTotal} ккал</strong> | 
                        Білки: ${totalProteins}г | Жири: ${totalFats}г | Вуглеводи: ${totalCarbs}г
                    </div>
                    <div style="width: 100%;">
                        Основні страви: ${baseTotal} ккал | Перекуси: ${snacksTotal} ккал
                    </div>
                    ${status}
                </div>
            `;
        }
    }

    // Initial display
    updateDayDisplay();

    // Checkout modal
    const checkoutModal = setupCheckoutModal({
        onSubmit: async (formValues) => {
            if (orderStatus) {
                orderStatus.innerHTML = '';
            }
            const { grandTotal } = calculateTotalCalories();
            const dayData = getCurrentDayData();
            const currentDay = dayData.day || (days.length > 0 ? days[currentDayIndex].day : 1);
            const selectedSnacks = selectedSnacksByDay.get(currentDay) || new Map();
            
            const baseMeals = ['breakfast', 'lunch', 'dinner']
                .map(key => dayData.menu[key])
                .filter(Boolean);
            const items = [
                ...baseMeals.map(meal => ({
                    name: meal.name,
                    calories: meal.calories,
                })),
                ...Array.from(selectedSnacks.values()).map(snack => ({
                    name: snack.name,
                    calories: snack.calories,
                })),
            ];

            const payload = {
                record_id: menuData.record_id,
                user_name: formValues.user_name,
                phone: formValues.phone,
                address: formValues.address,
                delivery_time: formValues.delivery_time,
                items,
                total_calories: grandTotal,
                day_number: days.length > 0 ? days[currentDayIndex].day : 1,
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Не вдалося відправити замовлення.');
                }

                saveToStorage(STORAGE_KEYS.lastOrder, data);
                if (orderStatus) {
                    orderStatus.innerHTML = `<div class="alert success">${data.message} (№${data.order_id})</div>`;
                }
                checkoutModal.close();
            } catch (error) {
                if (orderStatus) {
                    orderStatus.innerHTML = `<div class="alert error">${error.message}</div>`;
                }
            }
        },
    });

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            checkoutModal.open({
                user_name: menuData.user_name,
            });
        });
    }
}

/**
 * Create DOM element for a meal
 */
function createMealCard(meal) {
    const card = document.createElement('article');
    card.className = 'meal-card';

    const content = document.createElement('div');
    content.className = 'card-content';

    const title = document.createElement('h3');
    title.textContent = meal.name;

    const meta = document.createElement('div');
    meta.className = 'meal-meta';
    const macros = [];
    if (meal.proteins !== undefined) macros.push(`Б: ${meal.proteins}г`);
    if (meal.fats !== undefined) macros.push(`Ж: ${meal.fats}г`);
    if (meal.carbs !== undefined) macros.push(`В: ${meal.carbs}г`);
    meta.innerHTML = `<span>${meal.calories} ккал</span><span>${macros.join(' | ')}</span><span>${(meal.tags || []).join(' · ')}</span>`;

    const ingredients = document.createElement('p');
    ingredients.className = 'ingredients';
    ingredients.textContent = `Інгредієнти: ${meal.ingredients.join(', ')}`;

    content.append(title, meta, ingredients);
    card.append(content);
    return card;
}

/**
 * Create DOM element for a snack and handle selection toggles
 */
function createSnackCard(snack, selectedSnacks, dayNumber, onToggle, isSelected = false) {
    const card = document.createElement('article');
    card.className = 'snack-card';
    card.dataset.snackId = snack.id;
    if (isSelected) {
        card.classList.add('selected');
    }

    const content = document.createElement('div');
    content.className = 'card-content';

    const title = document.createElement('h4');
    title.textContent = snack.name;

    const meta = document.createElement('div');
    meta.className = 'snack-meta';
    meta.textContent = `${snack.calories} ккал`;

    const description = document.createElement('p');
    description.className = 'ingredients';
    description.textContent = snack.description || '';

    const button = document.createElement('button');
    button.className = 'btn btn-secondary';
    button.type = 'button';
    button.textContent = isSelected ? 'Видалити' : 'Додати перекус';

    button.addEventListener('click', () => {
        const id = snack.id;
        if (selectedSnacks.has(id)) {
            selectedSnacks.delete(id);
            card.classList.remove('selected');
            button.textContent = 'Додати перекус';
        } else {
            selectedSnacks.set(id, snack);
            card.classList.add('selected');
            button.textContent = 'Видалити';
        }
        onToggle();
    });

    content.append(title, meta, description, button);
    card.append(content);
    return card;
}

/**
 * Modal controller for checkout form
 */
function setupCheckoutModal({ onSubmit }) {
    const backdrop = document.getElementById('checkout-backdrop');
    const form = document.getElementById('checkout-form');
    const closeBtn = backdrop?.querySelector('.modal-close');

    if (!backdrop || !form) {
        return {
            open: () => {},
            close: () => {},
        };
    }

    function close() {
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
        form.reset();
    }

    function open(prefill = {}) {
        if (prefill.user_name) {
            const nameField = form.querySelector('[name="user_name"]');
            if (nameField) {
                nameField.value = prefill.user_name;
            }
        }
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', close);
    }
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) {
            close();
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());
        await onSubmit(values);
    });

    return { open, close };
}

// Bootstrap logic
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    switch (page) {
        case 'plans':
            initPlansPage();
            break;
        case 'preferences':
            initPreferencesPage();
            break;
        case 'menu':
            initMenuPage();
            break;
        default:
            break;
    }
});


