"""
Flask application for FoodFit API.
Provides endpoints for preferences, snacks, and orders.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, List, Any, Iterable
import re
import models

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from frontend

# Meal library with sample meals (БЖВ: білки, жири, вуглеводи в грамах)
MEAL_LIBRARY = {
    "breakfast": [
        {
            "name": "Вівсянка з ягодами",
            "calories": 350,
            "proteins": 12,
            "fats": 8,
            "carbs": 58,
            "ingredients": ["вівсянка", "ягоди", "мед"],
            "tags": ["веган", "швидко"],
        },
        {
            "name": "Омлет зі шпинатом",
            "calories": 320,
            "proteins": 22,
            "fats": 20,
            "carbs": 8,
            "ingredients": ["яйця", "шпинат", "сир"],
            "tags": ["білок", "швидко"],
        },
        {
            "name": "Чіа пудинг з манго",
            "calories": 280,
            "proteins": 10,
            "fats": 15,
            "carbs": 32,
            "ingredients": ["чіа", "кокосове молоко", "манго"],
            "tags": ["веган", "без глютену"],
        },
        {
            "name": "Грецький йогурт з горіхами",
            "calories": 380,
            "proteins": 20,
            "fats": 18,
            "carbs": 32,
            "ingredients": ["грецький йогурт", "горіхи", "мед"],
            "tags": ["білок", "швидко"],
        },
        {
            "name": "Тост з авокадо та яйцем",
            "calories": 340,
            "proteins": 16,
            "fats": 22,
            "carbs": 28,
            "ingredients": ["хліб цільнозерновий", "авокадо", "яйце"],
            "tags": ["білок", "корисні жири"],
        },
        {
            "name": "Сирники з ягодами",
            "calories": 360,
            "proteins": 18,
            "fats": 12,
            "carbs": 42,
            "ingredients": ["сир", "борошно", "ягоди"],
            "tags": ["білок", "молочні"],
        },
        {
            "name": "Смузі боул",
            "calories": 300,
            "proteins": 8,
            "fats": 10,
            "carbs": 48,
            "ingredients": ["банани", "шпинат", "ягоди", "чіа"],
            "tags": ["веган", "швидко"],
        },
    ],
    "lunch": [
        {
            "name": "Лосось із кіноа",
            "calories": 520,
            "proteins": 35,
            "fats": 18,
            "carbs": 52,
            "ingredients": ["лосось", "кіноа", "овочі"],
            "tags": ["білок", "омега-3"],
        },
        {
            "name": "Курка з булгуром",
            "calories": 480,
            "proteins": 38,
            "fats": 12,
            "carbs": 48,
            "ingredients": ["курка", "булгур", "овочі"],
            "tags": ["білок", "швидко"],
        },
        {
            "name": "Тофу боул",
            "calories": 450,
            "proteins": 22,
            "fats": 15,
            "carbs": 58,
            "ingredients": ["тофу", "рис", "овочі", "соєвий соус"],
            "tags": ["веган", "білок"],
        },
        {
            "name": "Індичка з бататом та брокколі",
            "calories": 460,
            "proteins": 40,
            "fats": 10,
            "carbs": 42,
            "ingredients": ["індичка", "батат", "брокколі"],
            "tags": ["білок", "низькі вуглеводи"],
        },
        {
            "name": "Вегетаріанський бургер",
            "calories": 440,
            "proteins": 18,
            "fats": 16,
            "carbs": 56,
            "ingredients": ["котлета з бобів", "булочка", "овочі"],
            "tags": ["веган", "швидко"],
        },
        {
            "name": "Грецький салат з куркою",
            "calories": 420,
            "proteins": 32,
            "fats": 20,
            "carbs": 28,
            "ingredients": ["курка", "помидори", "огірки", "фета", "оливкова олія"],
            "tags": ["білок", "свіжість"],
        },
        {
            "name": "Паста з морепродуктами",
            "calories": 500,
            "proteins": 28,
            "fats": 14,
            "carbs": 62,
            "ingredients": ["паста", "креветки", "помідори", "часник"],
            "tags": ["білок", "морепродукти"],
        },
        {
            "name": "Рататуй з рибною котлетою",
            "calories": 470,
            "proteins": 30,
            "fats": 16,
            "carbs": 46,
            "ingredients": ["риба", "баклажани", "кабачки", "помідори"],
            "tags": ["білок", "овочі"],
        },
    ],
    "dinner": [
        {
            "name": "Місо суп з локшиною",
            "calories": 380,
            "proteins": 16,
            "fats": 8,
            "carbs": 58,
            "ingredients": ["місо", "локшина", "водорості", "тофу"],
            "tags": ["веган", "легко"],
        },
        {
            "name": "Запечені овочі",
            "calories": 320,
            "proteins": 8,
            "fats": 12,
            "carbs": 48,
            "ingredients": ["батат", "брокколі", "перець", "оливкова олія"],
            "tags": ["веган", "без глютену"],
        },
        {
            "name": "Індичка з бататом",
            "calories": 420,
            "proteins": 36,
            "fats": 10,
            "carbs": 38,
            "ingredients": ["індичка", "батат", "брокколі"],
            "tags": ["білок", "низькі вуглеводи"],
        },
        {
            "name": "Овочева запіканка з сиром",
            "calories": 350,
            "proteins": 20,
            "fats": 18,
            "carbs": 28,
            "ingredients": ["кабачки", "помідори", "сир", "яйця"],
            "tags": ["білок", "легко"],
        },
        {
            "name": "Рибний суп",
            "calories": 340,
            "proteins": 28,
            "fats": 10,
            "carbs": 32,
            "ingredients": ["риба", "овочі", "рис"],
            "tags": ["білок", "легко"],
        },
        {
            "name": "Салат з тунцем",
            "calories": 360,
            "proteins": 32,
            "fats": 14,
            "carbs": 24,
            "ingredients": ["тунець", "листя салату", "овочі", "оливкова олія"],
            "tags": ["білок", "легко"],
        },
        {
            "name": "Грибна юшка з крупяною кашею",
            "calories": 330,
            "proteins": 12,
            "fats": 8,
            "carbs": 52,
            "ingredients": ["гриби", "крупа", "овочі"],
            "tags": ["веган", "легко"],
        },
        {
            "name": "Курячий салат з авокадо",
            "calories": 380,
            "proteins": 30,
            "fats": 20,
            "carbs": 18,
            "ingredients": ["курка", "авокадо", "листя салату", "овочі"],
            "tags": ["білок", "низькі вуглеводи"],
        },
    ],
}


def try_parse_int(value: Any, default: int = 0) -> int:
    """Try to parse value as integer, return default if fails."""
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def normalize_terms(value: Any) -> List[str]:
    """
    Convert user input (string or list) into a clean lowercase list of keywords.
    Supports comma or newline separated strings.
    """
    if value is None:
        return []

    if isinstance(value, list):
        raw_items = value
    else:
        normalized = value.replace(";", ",")
        raw_items = normalized.split(",")

    cleaned = [item.strip().lower() for item in raw_items if item.strip()]
    return cleaned


def meal_matches_preferences(
    meal: Dict[str, Any],
    dislikes: Iterable[str],
    allergies: Iterable[str],
) -> bool:
    """
    Check whether a meal avoids all disliked items and allergens.
    We perform a simple substring check across the ingredient names.
    """
    combined_stop_list = list(dislikes) + list(allergies)

    if not combined_stop_list:
        return True

    haystack = [meal["name"].lower()] + [ing.lower() for ing in meal["ingredients"]]
    for banned in combined_stop_list:
        if any(banned in field for field in haystack):
            return False
    return True


def score_meal_for_likes(meal: Dict[str, Any], likes: Iterable[str]) -> int:
    """
    Simple scoring that counts how many liked terms appear in the meal's
    ingredients or name. Higher score means the meal is more preferable.
    """
    if not likes:
        return 0
    haystack = [meal["name"].lower()] + [ing.lower() for ing in meal["ingredients"]]
    score = 0
    for liked in likes:
        if any(liked in field for field in haystack):
            score += 1
    return score


def pick_meal(
    meal_type: str,
    likes: Iterable[str],
    dislikes: Iterable[str],
    allergies: Iterable[str],
) -> Dict[str, Any]:
    """
    Choose the most suitable meal for a given meal_type (breakfast, lunch, dinner)
    while respecting dislikes and allergens.
    """
    options = MEAL_LIBRARY.get(meal_type, [])
    if not options:
        raise ValueError(f"No meal options configured for '{meal_type}'")

    safe_options = [
        meal for meal in options if meal_matches_preferences(meal, dislikes, allergies)
    ]
    if not safe_options:
        safe_options = options  # fall back to something rather than failing

    decorated: List[tuple] = [
        (score_meal_for_likes(meal, likes), meal) for meal in safe_options
    ]

    decorated.sort(key=lambda item: item[0], reverse=True)
    best_meal = decorated[0][1]
    return best_meal


def get_used_meals_from_history(history: List[Dict[str, Any]], days_to_check: int = 7) -> Dict[str, set]:
    """
    Extract meal names used in recent history (last N days).
    Returns dict with meal_type -> set of meal names.
    """
    used_meals = {"breakfast": set(), "lunch": set(), "dinner": set()}
    
    # Get last N days
    recent_days = sorted(history, key=lambda x: x["day_number"], reverse=True)[:days_to_check]
    
    for day_data in recent_days:
        menu = day_data.get("menu", {})
        for meal_type in ["breakfast", "lunch", "dinner"]:
            if meal_type in menu and "name" in menu[meal_type]:
                used_meals[meal_type].add(menu[meal_type]["name"])
    
    return used_meals


def get_used_day_menus_from_history(history: List[Dict[str, Any]], days_to_check: int = 7) -> set:
    """
    Extract full day menu combinations (breakfast + lunch + dinner) used in recent history.
    Returns set of tuples (breakfast_name, lunch_name, dinner_name).
    """
    used_day_menus = set()
    
    # Get last N days
    recent_days = sorted(history, key=lambda x: x["day_number"], reverse=True)[:days_to_check]
    
    for day_data in recent_days:
        menu = day_data.get("menu", {})
        breakfast_name = menu.get("breakfast", {}).get("name", "")
        lunch_name = menu.get("lunch", {}).get("name", "")
        dinner_name = menu.get("dinner", {}).get("name", "")
        
        if breakfast_name and lunch_name and dinner_name:
            day_menu_tuple = (breakfast_name, lunch_name, dinner_name)
            used_day_menus.add(day_menu_tuple)
    
    return used_day_menus


def pick_meal_with_history(
    meal_type: str,
    likes: Iterable[str],
    dislikes: Iterable[str],
    allergies: Iterable[str],
    used_meals: set,
    max_attempts: int = 50,
) -> Dict[str, Any]:
    """
    Choose a meal that hasn't been used recently.
    Falls back to any safe meal if all have been used.
    """
    options = MEAL_LIBRARY.get(meal_type, [])
    if not options:
        raise ValueError(f"No meal options configured for '{meal_type}'")

    safe_options = [
        meal for meal in options 
        if meal_matches_preferences(meal, dislikes, allergies)
    ]
    if not safe_options:
        safe_options = options

    # Filter out recently used meals
    available_options = [
        meal for meal in safe_options 
        if meal["name"] not in used_meals
    ]
    
    # If all meals were used, allow repeats but prefer less recent ones
    if not available_options:
        available_options = safe_options

    # Score and pick best
    decorated: List[tuple] = [
        (score_meal_for_likes(meal, likes), meal) for meal in available_options
    ]
    decorated.sort(key=lambda item: item[0], reverse=True)
    return decorated[0][1]


def calculate_macros(menu: Dict[str, Any]) -> Dict[str, int]:
    """Calculate total БЖВ (proteins, fats, carbs) for a menu."""
    total_proteins = 0
    total_fats = 0
    total_carbs = 0
    
    for meal_type in ["breakfast", "lunch", "dinner"]:
        if meal_type in menu:
            meal = menu[meal_type]
            total_proteins += meal.get("proteins", 0)
            total_fats += meal.get("fats", 0)
            total_carbs += meal.get("carbs", 0)
    
    return {
        "proteins": total_proteins,
        "fats": total_fats,
        "carbs": total_carbs,
    }


def calculate_target_macros(target_calories: int) -> Dict[str, float]:
    """
    Calculate target БЖВ based on standard ratios:
    - Proteins: 30% of calories (4 cal/g)
    - Fats: 30% of calories (9 cal/g)
    - Carbs: 40% of calories (4 cal/g)
    """
    target_proteins = (target_calories * 0.30) / 4
    target_fats = (target_calories * 0.30) / 9
    target_carbs = (target_calories * 0.40) / 4
    
    return {
        "proteins": round(target_proteins),
        "fats": round(target_fats),
        "carbs": round(target_carbs),
    }


def generate_menu(
    likes: Iterable[str],
    dislikes: Iterable[str],
    allergies: Iterable[str],
    target_calories: int,
    history: List[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Build a menu dictionary for breakfast, lunch and dinner.
    Avoids repeating full day menus from last 7 days.
    Also avoids repeating individual meals from last 7 days when possible.
    Tries to match target calories and БЖВ.
    """
    if history is None:
        history = []
    
    used_meals = get_used_meals_from_history(history, days_to_check=7)
    used_day_menus = get_used_day_menus_from_history(history, days_to_check=7)
    target_macros = calculate_target_macros(target_calories)
    
    menu = {}
    best_score = float('inf')
    best_menu = None
    
    # Try multiple combinations to find best match
    for attempt in range(50):  # Increased attempts to find unique combinations
        current_menu = {}
        for meal_type in ("breakfast", "lunch", "dinner"):
            choice = pick_meal_with_history(
                meal_type, likes, dislikes, allergies,
                used_meals.get(meal_type, set())
            )
            current_menu[meal_type] = choice
        
        # Check if this exact day menu combination was used recently
        breakfast_name = current_menu["breakfast"]["name"]
        lunch_name = current_menu["lunch"]["name"]
        dinner_name = current_menu["dinner"]["name"]
        day_menu_tuple = (breakfast_name, lunch_name, dinner_name)
        
        if day_menu_tuple in used_day_menus:
            # Skip this combination, try again
            continue
        
        macros = calculate_macros(current_menu)
        total_calories = sum(meal["calories"] for meal in current_menu.values())
        
        # Calculate deviation score (lower is better)
        calorie_diff = abs(total_calories - target_calories)
        protein_diff = abs(macros["proteins"] - target_macros["proteins"])
        fat_diff = abs(macros["fats"] - target_macros["fats"])
        carb_diff = abs(macros["carbs"] - target_macros["carbs"])
        
        # Weighted score (calories most important)
        score = calorie_diff * 2 + protein_diff + fat_diff + carb_diff
        
        if score < best_score:
            best_score = score
            best_menu = current_menu.copy()
            best_menu["total_calories"] = total_calories
            best_menu["total_proteins"] = macros["proteins"]
            best_menu["total_fats"] = macros["fats"]
            best_menu["total_carbs"] = macros["carbs"]
    
    # If we couldn't find a unique combination after many attempts,
    # allow a repeat but prefer one that's further in history
    if best_menu is None:
        # Fallback: use any valid menu (this should rarely happen with enough meal variety)
        for meal_type in ("breakfast", "lunch", "dinner"):
            choice = pick_meal_with_history(
                meal_type, likes, dislikes, allergies,
                set()  # Don't restrict by individual meals in fallback
            )
            menu[meal_type] = choice
        
        macros = calculate_macros(menu)
        total_calories = sum(meal["calories"] for meal in menu.values())
        menu["total_calories"] = total_calories
        menu["total_proteins"] = macros["proteins"]
        menu["total_fats"] = macros["fats"]
        menu["total_carbs"] = macros["carbs"]
        return menu
    
    return best_menu


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/")
def root() -> Any:
    """Simple health-check endpoint."""
    return jsonify({"status": "ok", "service": "FoodFit API"})


@app.get("/api/snacks")
def snacks_endpoint() -> Any:
    """Return the list of snacks stored in the SQLite database."""
    snacks = models.fetch_snacks()
    return jsonify({"snacks": snacks})


@app.post("/api/preferences")
def preferences_endpoint() -> Any:
    """
    Accept user preferences, store them, generate menus for all days of the plan and return a JSON
    payload back to the frontend.
    Expected JSON body:
    {
        "user_name": "Анна",
        "calories": 2000,
        "likes": "лосось, чіа",
        "dislikes": "глютен",
        "allergies": "арахіс",
        "plan_type": "monthly"
    }
    """
    payload = request.get_json(force=True, silent=True) or {}

    user_name = payload.get("user_name", "").strip()
    if not user_name:
        return (
            jsonify({"error": "Поле 'ім'я' є обов'язковим."}),
            400,
        )

    requested_calories = try_parse_int(payload.get("calories"), default=2000)
    likes = normalize_terms(payload.get("likes"))
    dislikes = normalize_terms(payload.get("dislikes"))
    allergies = normalize_terms(payload.get("allergies"))
    plan_type = payload.get("plan_type", "weekly")

    # Determine number of days based on plan type
    days_count = 30 if plan_type == "monthly" else 7

    # Check if this is a new user or existing user
    conn = models.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id FROM preferences 
        WHERE user_name = ? 
        ORDER BY created_at DESC 
        LIMIT 1
    """, (user_name,))
    existing_pref = cursor.fetchone()
    conn.close()

    preference_id = None
    history = []
    
    if existing_pref:
        preference_id = existing_pref["id"]
        history = models.get_menu_history(preference_id, days_back=30)
    
    # Build history for menu generation (need at least 14 days to avoid repeats)
    current_history = history.copy()
    
    # Generate menus for all days
    all_days_menus = []
    
    for day in range(1, days_count + 1):
        # Generate menu for this day with history consideration
        # History includes previous days in this generation + existing history
        menu_data = generate_menu(
            likes, dislikes, allergies, requested_calories, current_history
        )
        
        menu = {
            "breakfast": menu_data["breakfast"],
            "lunch": menu_data["lunch"],
            "dinner": menu_data["dinner"],
        }
        total_menu_calories = menu_data.get("total_calories", 0)
        total_proteins = menu_data.get("total_proteins", 0)
        total_fats = menu_data.get("total_fats", 0)
        total_carbs = menu_data.get("total_carbs", 0)
        
        all_days_menus.append({
            "day": day,
            "menu": menu,
            "total_calories": total_menu_calories,
            "total_proteins": total_proteins,
            "total_fats": total_fats,
            "total_carbs": total_carbs,
        })
        
        # Add to history for next day generation (to avoid repeats within this plan)
        current_history.append({
            "day_number": day,
            "menu": menu,
        })
        
        # Keep only last 7 days in history to avoid memory issues
        if len(current_history) > 7:
            current_history = current_history[-7:]

    # Save preferences (creates new or updates)
    # Save first day's menu as the main menu for compatibility
    first_day_menu = all_days_menus[0]["menu"]
    first_day_calories = all_days_menus[0]["total_calories"]
    
    record_id = models.save_preferences(
        user_name=user_name,
        requested_calories=requested_calories,
        likes=", ".join(likes),
        dislikes=", ".join(dislikes),
        allergies=", ".join(allergies),
        plan_type=str(plan_type),
        menu=first_day_menu,
        total_calories=first_day_calories,
    )

    # Save all days to history
    for day_data in all_days_menus:
        models.save_menu_day(
            preference_id=record_id,
            day_number=day_data["day"],
            menu=day_data["menu"],
            total_calories=day_data["total_calories"],
            total_proteins=day_data["total_proteins"],
            total_fats=day_data["total_fats"],
            total_carbs=day_data["total_carbs"],
        )

    # Fetch snack suggestions for the user.
    snacks = models.fetch_snacks()

    response = {
        "user_name": user_name,
        "requested_calories": requested_calories,
        "plan_type": plan_type,
        "days_count": days_count,
        "days": all_days_menus,
        "snacks": snacks,
        "record_id": record_id,
    }
    return jsonify(response), 201


PHONE_PATTERN = re.compile(r"^[+0-9()\-\s]{7,20}$")


@app.post("/api/order")
def order_endpoint() -> Any:
    """
    Save an order for later processing. We perform basic validation before
    writing to the database.
    Expected JSON body:
    {
        "record_id": 12,
        "user_name": "Анна",
        "phone": "+380671112233",
        "address": "Київ, вул. Смачна, 1",
        "delivery_time": "18:30",
        "items": [{"name": "Лосось із кіноа", "calories": 520}, ...],
        "total_calories": 1800
    }
    """
    payload = request.get_json(force=True, silent=True) or {}

    user_name = payload.get("user_name", "").strip()
    phone = payload.get("phone", "").strip()
    address = payload.get("address", "").strip()
    delivery_time = payload.get("delivery_time", "").strip()
    items = payload.get("items") or []
    total_calories = try_parse_int(payload.get("total_calories"), default=0)
    preference_id = try_parse_int(payload.get("record_id"), default=0)

    if not user_name:
        return jsonify({"error": "Вкажіть ім'я для замовлення."}), 400
    if not phone or not PHONE_PATTERN.match(phone):
        return jsonify({"error": "Невірний формат номера телефону."}), 400
    if not address:
        return jsonify({"error": "Адреса доставки є обов'язковою."}), 400
    if not items:
        return jsonify({"error": "Список страв порожній."}), 400

    simplified_items: List[Dict[str, Any]] = []
    for entry in items:
        if isinstance(entry, dict):
            name = str(entry.get("name", "")).strip()
            calories = try_parse_int(entry.get("calories"), default=0)
            if name:
                simplified_items.append({"name": name, "calories": calories})

    if not simplified_items:
        return jsonify({"error": "Не вдалося зчитати перелік страв."}), 400

    order_id = models.save_order(
        preference_id=preference_id if preference_id > 0 else None,
        user_name=user_name,
        phone=phone,
        address=address,
        delivery_time=delivery_time,
        items=simplified_items,
        total_calories=total_calories,
    )
    return jsonify(
        {
            "status": "accepted",
            "order_id": order_id,
            "message": "Замовлення прийнято. Ми скоро зателефонуємо для підтвердження!",
        }
    ), 201


if __name__ == "__main__":
     port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

