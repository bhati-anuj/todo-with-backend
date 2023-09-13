import express from "express";
import bodyParser from "body-parser";

import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import _ from "lodash";
import "dotenv/config";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const DATABASE = process.env.DATA_BASE_LINK.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

main().catch((err) => console.log(err));

async function main() {
  mongoose.connect(DATABASE);

  const itemsSchema = {
    name: {
      type: String,
      required: true,
    },
  };

  const Item = mongoose.model("Item", itemsSchema);

  const listSchema = {
    name: {
      type: String,
      required: true,
    },
    items: [itemsSchema],
  };

  const List = mongoose.model("List", listSchema);

  const item1 = new Item({
    name: "Welcome to todo list",
  });

  const item2 = new Item({
    name: "Click on + to add new task",
  });

  const item3 = new Item({
    name: "These are default item",
  });

  const defaultItems = [item1, item2, item3];

  app.get("/", async (req, res) => {
    const foundData = await Item.find({});
    if (foundData) {
      
      res.render("index.ejs", { listTittle: "Home", task: foundData });
    }
  });

  app.post("/", async (req, res) => {
    const newItem = req.body.todo;
    const listName = req.body.addBtn;

    const item = new Item({
      name: newItem,
    });

    if (listName === "Home") {
      item.save();
      res.redirect("/");
    } else {
      const foundedList = await List.findOne({ name: listName });
      if(foundedList){

        foundedList.items.push(item);
        
        foundedList.save();
        res.redirect("/" + listName);
      }
    }
  });

  app.post("/delete", async (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listname;
   
    if (listName === "Home") {
      await Item.findOneAndDelete({ _id: checkedItemId });
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    }
  });

  app.get("/:customeListName", async (req, res) => {
    const customeListName = _.capitalize(req.params.customeListName);
    const foundedList = await List.findOne({ name: customeListName });

    if (!foundedList) {
      const list = new List({
        name: customeListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customeListName);
    } else {
      res.render("index.ejs", {
        listTittle: customeListName,
        task: foundedList.items,
      });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
