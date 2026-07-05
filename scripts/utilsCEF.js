const debugCEF = true;      // active/desactive la plupart des logs du Modules

function logCEF(...args){
  if(debugCEF){
    console.log("OUTRE-REVE || LOG -", ...args)
  }
}
async function ajusterClimatManuel(arpenteur, mod){
  if (game.settings.get('a-perte-de-reve', 'climatManuel')){
    arpenteur.CEF.ajusteClimat(mod);
  }else{
    Dialog.confirm({
      title: "Modification du Climat",
      content: "La gestion du climat est déja appliquée automatiquement. <br>Êtes-vous sur de vouloir le changer a nouveau?",
      yes: async (html) => { 
        await arpenteur.CEF.ajusteClimat(mod);
        arpenteur.tmrApp.$updateValuesDisplay();
      },
      no: (html) => { },
    })
  }
}

// Handlebars.registerHelper('selectOptionHelper', function(option, selectedValue) {
     // call within a EACH, attention au SCOPE -->  <option value="{{value}}" {{selectOptionHelper this ../selectedOption}}>{{label}}</option>
//   console.log("selectOption OPTION :", option);
//   console.log("selectOption SELECTED :", selectedValue);
//   if (option == selectedValue) {
//     console.log("selectOption :", option, "==", selectedValue);
//     return 'selected';
//     return 'selected="selected"';
//   }
//   return '';
// });
Handlebars.registerHelper('checkedOptions', function(value, options) {
  const div = document.createElement('div'); // create a container div
  div.innerHTML = options.fn(this);          // parse content into dom
  div.querySelectorAll('input[type=radio]').forEach(function(input) {
      // if input has value matching supplied value, check it
      if (input.value == value) input.defaultChecked = true;
  });
  return div.innerHTML;
});

// ================================================================================================================
function updateArpenteur_form(html){
  form = html[0].querySelector("form");
  console.log("update Me", html);
  console.log("update Me query", form);
  let clim = parseInt(form.climat.value);
  let imago = form.imago.value;
  let carte = form.cartecef.value;

  console.log("Climat", clim);
  console.log("Imago", imago);
  console.log("Carte CEF", carte);


  let selected = game.system.rdd.RdDUtility.getSelectedActor();
  if (selected.CEF.basculerTmrCEF ( imago == true ? "CEF" : "TMR", true) == true){
  // if (selected.CEF.basculerTmrCEF ( imago ? "CEF" : "TMR", forced = true)){}
  // if (selected.CEF.basculerTmrCEF ( carte, forced = true)){
    selected.CEF._setClimat(clim);
  }

  // let climat = document.getElementById("cef-climat-value");
  //   climat.innerHTML = RDD_CEF.Climat[this.actor.CEF.climatActuel()].label;

}