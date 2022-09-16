import { action } from "@ember/object";
import Component from "@ember/component";
import { dasherize } from "@ember/string";
import discourseComputed from "discourse-common/utils/decorators";
import I18n from "I18n";
import { schedule } from "@ember/runloop";

function parseSettings(settings) {
  let parsed = [];
  settings.split("|").map(i => {
      let seg = $.map(i.split(":"), $.trim);
      let catGroup = seg[0];
      let cats = seg[1];
      parsed.push({ catGroup: catGroup, cats: cats });
  });
  return parsed;
}

function parseHeaderSettings(settings) {
  let parsed = [];
  settings.split("|").map(i => {
      let seg = $.map(i.split(";"), $.trim);
      let catGroup = seg[0];
      let type = seg[1];
      let code = seg[2];
      parsed.push({ catGroup: catGroup, type: type, code: code });
  });
  return parsed;
}

Handlebars.registerHelper('checkNames', function () {
  return this.name === this.hName;
})
Handlebars.registerHelper('checkNamesNot', function () {
  return this.name !== this.hName;
})
Handlebars.registerHelper('styleType', function () {
  let style = '';
  if (this.type === 'color') {
    style = "background-color: this.code"
  } else {
    style = "background-image: url(this.code);"
  }
  return style;
})

export default Component.extend({
  catGroupList: [],

  didInsertElement() {
    this._super(...arguments);

    schedule("afterRender", () => {

      if (localStorage.getItem("catGroups") === null) {
        let defaultObj = [".custom-category-group-muted"];
        localStorage.setItem("catGroups", JSON.stringify(defaultObj));
      }
    
      if (localStorage.getItem("catGroups")) {
        JSON.parse(localStorage.getItem("catGroups")).forEach(function(cat) {
          $(cat).removeClass("is-expanded");
        });
      }
 
    });
  },


  @discourseComputed("categories", "categories.length")
  catGroupList(categories, categoriesLength) {
    let catGroupList = [];
    let foundCats = [];

    const parsedSettings = parseSettings(settings.category_groups);
    // const parsedHeaderSettings = parseHeaderSettings(settings.category_headers);

    parsedSettings.forEach(function(obj) {
      let catGroup = categories.filter((c) => {     
          if (obj.cats.indexOf(c.slug) > -1 && !c.hasMuted) {
              foundCats.push(c.slug);
              return c;
          }
      })

      if (catGroup.length) { // don't show empty groups
        catGroupList.push({ name: obj.catGroup, cats: catGroup });
      }
    });

    // parsedHeaderSettings.forEach(function(obj) {
    //   let headerGroup = catGroupList.name.filter((c) => {     
    //       if (obj.catGroup === c.name) {
    //           return c;
    //       }
    //   })

    //   if (headerGroup.length) { // don't show empty groups
    //     catGroupList.push({ hName: obj.catGroup, type: obj.type.toLowerCase(), code: obj.code });
    //   }
    // });

    
    let ungroupedCats = categories.filter((c) => {
      return foundCats.indexOf(c.slug) == -1
    })
    let mutedCats = categories.filterBy("hasMuted");  
    
    if (settings.show_ungrouped) {
      if (ungroupedCats.length) {
        catGroupList.push({ name: I18n.t(themePrefix("ungrouped_categories_title"))
        , cats: ungroupedCats });
      }
    }

    if (mutedCats.length) {
      catGroupList.push({ name: "muted", cats: mutedCats });
    }

    return catGroupList;
  },

  @action
  toggleCats(e) {
    let id = dasherize(e);
    let storedCats = JSON.parse(localStorage.getItem("catGroups"));

    if (
      (storedCats != null) &&
      (storedCats.indexOf(".custom-category-group-" + id) > -1)
    ) {
      let index = storedCats.indexOf(".custom-category-group-" + id);
      if (index >= 0) {
        storedCats.splice( index, 1 );
      }
      $(".custom-category-group-" + id).addClass("is-expanded");
      localStorage.setItem("catGroups", JSON.stringify(storedCats));
    } else {
      storedCats.push(".custom-category-group-" + id);
      $(".custom-category-group-" + id).removeClass("is-expanded");
      localStorage.setItem("catGroups", JSON.stringify(storedCats));
    }
  }
  
});