import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

interface recipeSummary {
  name: string; 
  cookTime: number; 
  ingredients: requiredItem[];
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: (recipe | ingredient)[] = [];

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that is legible 
const parse_handwriting = (recipeName: string): string | null => {

  let regex =  /[-_]/g;
  let newRecipeName: string = recipeName.replace(regex, ' ');
  regex = /[^a-z\s]/g;
  newRecipeName = newRecipeName.toLowerCase().replace(regex, '');
  regex = /\s+/g;
  newRecipeName = newRecipeName.replace(regex, ' ').trim();
  
  let splitName = newRecipeName.split(' ');
  let capitalisedName = splitName.map(word => word.charAt(0).toUpperCase() + word.slice(1));
  newRecipeName = capitalisedName.join(' ');

  if (newRecipeName.length > 0) return newRecipeName;
  return null;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const entry = req.body;
  
  if (entry.type !== "recipe" && entry.type !== "ingredient") {
    res.status(400).send("invalid type");
    return;
  }
  if (entry.type === "ingredient" && entry.cookTime < 0) {
    res.status(400).send("cookTime cannot be negative");
    return;
  }
  if (cookbook.some(e => e.name === entry.name)) {
    res.status(400).send("entry names must be unique");
    return;
  }
  if (entry.name === "recipe") {
    const reqItems = new Set();
    for (const item of entry.requiredItems) {
      if (item.quantity <= 0 || reqItems.has(item.name)) {
        res.status(400).send("requiredItems can only have one element per name");
        return;
      }
      reqItems.add(item.name);
    }
  }
  let newEntry: recipe | ingredient;
  if (entry.type === "recipe") {
    newEntry = {
      name: entry.name,
      type: "recipe",
      requiredItems: entry.requiredItems
    }
  } else {
    newEntry = {
      name: entry.name,
      type: "ingredient",
      cookTime: entry.cookTime 
    }
  }
  cookbook.push(newEntry);
  res.status(200).send();
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name

function recurseRecipes(item:requiredItem, res:Response, summary:recipeSummary, quantity:number) {

  const currItem = cookbook.find(e => e.name === item.name);
  if (currItem === undefined) {
    res.status(400).send("recipe not found");
    return;
  }

  if (currItem.type === "ingredient") {
    // Add to total cooktime 
    const currIngredient = currItem as ingredient;
    summary.cookTime = (item.quantity * currIngredient.cookTime) * quantity;

    // Add ingredient quantity to summary
    const existingIngredient = summary.ingredients.find(i => i.name === item.name);

    if (existingIngredient) {
      existingIngredient.quantity += item.quantity * quantity;
    } else {
      const addIngredient: requiredItem = {
        name: item.name,
        quantity: item.quantity * quantity
      }
      summary.ingredients.push(addIngredient);
    }
  }
  
  if (currItem.type === "recipe") {
    const currRecipe = currItem as recipe;
    for (const subItem of currRecipe.requiredItems) {
      recurseRecipes(subItem, res, summary, item.quantity * quantity);
    }
  }
}

app.get("/summary", (req:Request, res:Response) => {
  const recipeName = req.query.name as string;

  const reqRecipe = cookbook.find(r => r.name === recipeName);
  if (reqRecipe === undefined || reqRecipe.type === "ingredient") {
    res.status(400).send("recipe not found");
    return;
  }
  const summary: recipeSummary = {
    name: recipeName,
    cookTime: 0,
    ingredients: []
  }
  const recipeQuantity = 1;
  for (let currItem of (reqRecipe as recipe).requiredItems) {
    recurseRecipes(currItem, res, summary, recipeQuantity);
  }
  res.status(200).send();
});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
