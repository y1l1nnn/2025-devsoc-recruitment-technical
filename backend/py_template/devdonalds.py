from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int


# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
cookbook = None

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that 
def parse_handwriting(recipeName: str) -> Union[str, None]:
	
	recipeName = re.sub(r"[_-]", ' ', recipeName) 
	recipeName = re.sub(r"[^a-zA-Z\s]", '', recipeName)	
	recipeName = re.sub(r"\s+", ' ', recipeName).strip()
	recipeName = recipeName.title()

	if recipeName: 
		return recipeName
	else: 
		return None

# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	entry_data = request.get_json()
	global cookbook
	if cookbook is None: cookbook = {}

	entry_type = entry_data.get("type")
	entry_name = entry_data.get("name")

	if entry_type != "recipe" and entry_type != "ingredient":
		return jsonify({"error": "invalid type"}), 400

	if entry_name in cookbook:
		return jsonify({"error": "entry names must be unique"}), 400

	if entry_type == "ingredient":
		cook_time = entry_data.get("cookTime")

		if cook_time is None or not isinstance(cook_time, int) or cook_time < 0:
			return jsonify({"error": "cookTime cannot be negative"}), 400

		cookbook[entry_name] = Ingredient(name=entry_name, cook_time=cook_time)

	if entry_type == "recipe":
		required_items = entry_data.get("requiredItems")

		req_item_names = set()
		req_items = []
		for item in required_items:
			item_name = item.get("name")
			item_quantity = item.get("quantity")

			if item_quantity is None or not isinstance(item_quantity, int) or item_quantity <= 0:
				return jsonify({"error": "requiredItems can only have one element per name"}), 400
			
			if item_name in req_item_names: 
				return jsonify({"error": "requiredItems can only have one element per name"}), 400

			req_item_names.add(item_name)
			req_items.append(RequiredItem(name=item_name, quantity=item_quantity))

		cookbook[entry_name] = Recipe(name=entry_name, required_items=req_items)
	
	return "", 200

# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name
@app.route('/summary', methods=['GET'])
def summary():
	# TODO: implement me
	return 'not implemented', 500


# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
