function logCEF(...args){
  if(game.settings.get('a-perte-de-reve', 'debugCEF')){
    console.log("OUTRE-REVE || LOG -", ...args)
  }
}
function ajusterClimatManuel(arpenteur, mod){
  if (game.settings.get('a-perte-de-reve', 'climatManuel')){
    arpenteur.CEF.ajusteClimat(mod);
  }else{
    Dialog.confirm({
      title: "Modification du Climat",
      content: "La gestion du climat est déja appliquée automatiquement. <br>Êtes-vous sur de vouloir le changer a nouveau?",
      yes: async (html) => { 
        arpenteur.CEF.ajusteClimat(mod);
        // arpenteur.tmrApp.$updateValuesDisplay();
      },
      no: (html) => { },
    })
  }
}

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
    selected.CEF._setClimat(clim);
  }

  // let climat = document.getElementById("cef-climat-value");
  //   climat.innerHTML = RDD_CEF.Climat[this.actor.CEF.climatActuel()].label;

}