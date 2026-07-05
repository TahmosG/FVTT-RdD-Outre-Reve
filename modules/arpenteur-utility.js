export class ArpenteurUtility extends Dialog {

    static utilDialog = null;
    static utilData = null;

    static openDialog(){
        let selected = game.system.rdd.RdDUtility.getSelectedActor()
        let arpenteur = selected?.CEF.isArpenteur() == true
            ? selected 
            : game.outreReve.Arpenteur.liste[0]
        if (ArpenteurUtility.utilDialog == null){
            ArpenteurUtility.init(arpenteur);
        } else {
            ArpenteurUtility.utilDialog.bringToTop();
        }
        return ArpenteurUtility.utilDialog;
    }

    static async init (arpenteur) {
        const html = await ArpenteurUtility.getHTML(arpenteur);
        ArpenteurUtility.utilDialog = new ArpenteurUtility({
            title: "Utilitaire pour Arpenteurs",
            content: html,
            buttons: {
            //   submit: { label: "Appliquer", callback: (html) => {updateArpenteur (html)} },
            },
            close: () => { ArpenteurUtility.utilDialog = null; }
        })
        ArpenteurUtility.utilDialog.render(true);
        // ArpenteurUtility.utilDialog.activateListeners(html);
    }
      
    static async updateArpenteur(arpenteurIndex, imago, climat, position){
        console.log (`OUTRE-REVE || updtArpenteur (imago = ${imago}, climat = ${climat})`);
        let selected = game.outreReve.Arpenteur.liste[arpenteurIndex];
        let destination = imago == "true" ? "CEF" : "TMR";
        await selected.updateCoordTMR(position);
        // await selected.tmrApp?.actor.notifyRefreshTMR();        // ca marche po :(
        selected.tmrApp?.externalRefresh();
        selected.CEF.basculerTmrCEF ( destination, true);
        selected.CEF._setClimat(parseInt(climat));
    }

    static async getHTML(arpenteur){
        console.log("utilDialog = ", ArpenteurUtility.utilDialog);
        if (arpenteur == null){
            arpenteur = game.outreReve.Arpenteur.liste[0];
        }
        ArpenteurUtility.utilData = {
            options : game.outreReve.Arpenteur.liste, 
            selected : {
                actor :   arpenteur,
                imago :   arpenteur?.CEF.isImago(),
                climat :  arpenteur?.CEF.climatActuel(),
                position: arpenteur?.system.reve.tmrpos.coord,
            }
        }
        const template = `modules/a-perte-de-reve/templates/cef-utilities.hbs`;
        const html = await renderTemplate(template, ArpenteurUtility.utilData);
        return html;
    }
    
    static async refresh(arpenteur){
        console.log(ArpenteurUtility.utilDialog);
        if (ArpenteurUtility.utilDialog != null) {
            ArpenteurUtility.utilDialog.data.content = await ArpenteurUtility.getHTML(arpenteur);
            ArpenteurUtility.utilDialog.render();
        }
    }
    
    async activateListeners(html) {
        await super.activateListeners(html);
        // html.find('.select-perso').change(event => ArpenteurUtility.refresh(true, event));

        const selectElement = document.getElementById('characterID');
        selectElement.addEventListener('change', function(event) {
            const selectedValue = event.target.value;
            console.log('Selected value:', selectedValue);
            // Update your application state here
            ArpenteurUtility.refresh(game.outreReve.Arpenteur.liste[selectedValue])
        });

        // Le reste...
        // this.$updateValuesDisplay();
    }
}