const mongoose = require("mongoose");
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.DB_HOST);
const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "welcome to your todo list",
});
const item2 = new Item({
  name: "hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- hit this to delete an item",
});
const defualtItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {
  Item.find({}).then((items) => {
    if (items.length === 0) {
      Item.insertMany(defualtItems);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    await List.findOne({ name: listName }).then(async (foundList) => {
      foundList.items.push(newItem);
      await foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    await Item.findByIdAndDelete(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});

app.get("/:listName", async (req, res) => {
  const listName = _.capitalize(req.params.listName);
  List.findOne({ name: listName }).then(async (list) => {
    if (list === null) {
      const list = new List({
        name: listName,
        items: defualtItems,
      });
      await list.save();
      res.redirect("/" + listName);
    } else {
      res.render("list", { listTitle: list.name, newListItems: list.items });
    }
  });
});

app.get("/about", async (req, res) => {
  res.render("about");
});

app.listen(3000, async () => {
  console.log("Server started on port 3000");
});
