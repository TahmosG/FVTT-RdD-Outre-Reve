import { TMRUtility } from "/systems/foundryvtt-reve-de-dragon/module/tmr-utility.js";
import { RdDDice } from "/systems/foundryvtt-reve-de-dragon/module/rdd-dice.js";
import { SHOW_DICE, SYSTEM_RDD } from "/systems/foundryvtt-reve-de-dragon/module/constants.js";

import { OutreReve } from "/modules/a-perte-de-reve/modules/outrereve.js";

/** TO DO
 *  [V] Encaisser immediatement la fatigue (ne se cumule pas)
 *  [V] Rencontres changent le Climat
 *  [V] Quand bascule: fatigue +1 
 *  [V] Quand bascule: tirer rencontre
 *  [] Temperer le Climat : -(qualité) Maitrise du Fleuve avec ARPENTAGE
 *  [] Temperer le Climat : -1 au Chateau dormant
 *  [] hook lors de l'ajout/suppression du "don d'Arpantage" (competence + init)
 */
export class Arpenteur {
    static liste = []; //liste des Arpenteurs reconnus
    constructor (perso){
        //ui.notifications.info(`OUTRE-REVE || Creation de l'objet ARPENTEUR pour ${perso.name}`); 
        this.arpenteur = perso;
    }
    static async initAll(){
        console.log (`OUTRE-REVE || Initialization des Arpenteurs: `);
        Arpenteur.liste.length = 0;
        await game.actors.forEach( element => { this.init(element) } )
        console.log (`OUTRE-REVE || Initialization des Arpenteurs: `, Arpenteur.liste);
    }
    static async init(perso){
        if (this._donArpentage(perso)){
            logCEF(`Initialization des Arpenteurs - ${perso.name} possède le don d'Arpentage`);
            Arpenteur.liste.push(perso);
            if (perso.getFlag(`a-perte-de-reve`, `isArpenteur`) != true){ // si true, pas besoin d'overide les Flags
                await perso.setFlag(`a-perte-de-reve`, `isArpenteur`, true);
                await perso.setFlag(`a-perte-de-reve`, `Imago`, true);
                await perso.setFlag(`a-perte-de-reve`, `Climat`, 1);
                console.log(`OUTRE-REVE || Arpenteur - Initialization des FLAGs pour ${perso.name}`); 
            }
        } else {
            logCEF(`Initialization des Arpenteurs - ${perso.name} n'a pas le don d'Arpentage`);
            await perso.setFlag(`a-perte-de-reve`, `isArpenteur`, false);
            await perso.setFlag(`a-perte-de-reve`, `Imago`, "N/A");
            await perso.setFlag(`a-perte-de-reve`, `Climat`, 0); // 0 = climat TMR
        }
        // Ajout d'un Objet TEMPORAIRE dans l'arpenteur
        if (!perso.CEF) { perso.CEF = new Arpenteur(perso); }
        return perso.CEF;
    }
    static async clearAll(){
        console.log (`OUTRE-REVE || Initialization des Arpenteurs: `);
        await game.actors.forEach( element => { this.clearFlags(element) } )
    }
    static async clearFlags (arpenteur, init = false) { 
        arpenteur.clearFlags(init)
    }
    static _donArpentage (perso) {
        return (perso.items.filter(item => item.name == "Don d'Arpenter le Fleuve").length > 0) ? true : false;
    }
    static async changeClimat(arpenteur, rencontre){
        console.log(`OUTRE-REVE || CarteCEF - Change climat pour ${arpenteur}: `, rencontre);
        // ...
    }

    /**************************
     *      OBJECT Methods    *
     **************************/ 
    isArpenteur(){ 
        return this.arpenteur.getFlag(`a-perte-de-reve`, `isArpenteur`);
    }
    isImago(){ 
        return this.arpenteur.getFlag(`a-perte-de-reve`, `Imago`);
    }
    carteActuelle() { 
        let imago = this.arpenteur.getFlag(`a-perte-de-reve`, `Imago`);
        if (imago == true) {  
            return "CEF";
        } else {       
            return "TMR";
        }
    }
    etatActuel() { 
        let imago = this.arpenteur.getFlag(`a-perte-de-reve`, `Imago`);
        let result = "";
        if (this.arpenteur?.tmrApp == undefined){
            result = "Vrai-Rêve"
        } else {
            result = (imago == true) ? "Imago" : "Demi-Rêve";
        }
        console.log("OUTRE-REVE ||", this.arpenteur.name,"est en", result);
        return result;
    }
    climatActuel() { 
        return this.arpenteur.getFlag(`a-perte-de-reve`, `Climat`);
    }
    async ajusteClimat(mod = 0){
        let clim = (mod == 0) 
            ? await RdDDice.rollTotal("1dt", { showDice: SHOW_DICE })       // aleatoire 1-7
            : this.arpenteur.getFlag(`a-perte-de-reve`, `Climat`) + mod;    // climat actuel + mod        
        let result = await this._setClimat(clim);
        ui.notifications.warn(`${this.arpenteur.name} - Changement du Climat : (${result}) ${RDD_CEF.Climat[result].label} - Rencontre sur ${RDD_CEF.Climat[result].jetRencontre}+`);
        return result;
    }
    async _setClimat(clim){
        // acceptable range = 1-7 ! (0 etant reserve au climat TMR)
        if (clim < 1) {
            clim = 1;
        }else if (clim >= RDD_CEF.Climat.length){
            clim = RDD_CEF.Climat.length-1;
        }
        await this.arpenteur.setFlag(`a-perte-de-reve`, `Climat`, clim);
        this.arpenteur.tmrApp?.$updateValuesDisplay();
        return clim;
    }

    rencontreMin(){
        // ui.notifications.info("Rencontre min: ",RDD_CEF.Climat[this.climatActuel()].label, ":", RDD_CEF.Climat[this.climatActuel()].rencontreMin);
        return RDD_CEF.Climat[this.climatActuel()].rencontreMin;
    }
    logArpenteur() { 
        if ( this.isArpenteur() == true){
            ui.notifications.info(`OUTRE-REVE || ${this.arpenteur.name} a son ${this.etatActuel()} en ${this.carteActuelle()} (Climat = ${this.climatActuel()})`); 
        } else {
            ui.notifications.info(`OUTRE-REVE || ${this.arpenteur.name} n'a pas le Don d'Arpenter le Fleuve`); 
        }
    }

    async basculerTmrCEF (destination = "", forced = false) { 

        console.log (`OUTRE-REVE || Basculer TMR-CEF (destination = ${destination}, forced = ${forced})`);

        //  VERIFICATIONS
        if (!this.isArpenteur()) { 
             ui.notifications.warn(`${this.arpenteur.name} n'est pas un Arpenteur`);
             return false;
        }
        if (destination == this.carteActuelle()){
            // ui.notifications.info(`${this.arpenteur.name} est deja en ${destination}`);
            return true;            
        }
        if (!this.arpenteur.tmrApp && forced == false) { 
            ui.notifications.info(`${this.arpenteur.name} doit etre en Demi-Rêve pour basculer entre TMR <-> CEF`);
            return false;
        }
        if (forced == true || this.peutBasculer(true)){
            //  BASCULEMENT
            await this._basculer(forced);
            return true;
        } 
        return false;
    }
    peutBasculer (notif = false) {
        if (!this.isArpenteur()) { return false }
        let pos = TMRUtility.getTMR(this.arpenteur.system.reve.tmrpos.coord);
        if( !this.isImago() && !TMRUtility.isCaseHumide(pos) ){ 
            if (notif == true) {ui.notifications.info(`${this.arpenteur.name} doit être sur une Case Humide pour basculer en CEF`);}
            return false
        }
        return true;
    }
    async _basculer(forced = false){ // Transition entre CEF <--> TMR
        // changement du status de l'Arpenteur
        let imago = !this.arpenteur.getFlag(`a-perte-de-reve`, `Imago`)
        await this.arpenteur.setFlag(`a-perte-de-reve`, `Imago`, imago);

        game.outreReve.enCEF = imago;

        // gestion des la fatigue
        if (game.settings.get("a-perte-de-reve", "basculeFatigue") && forced == false){
            this.arpenteur.tmrApp.cumulFatigue += this.arpenteur.tmrApp.fatigueParCase;
        }
        this.arpenteur.tmrApp?.gestionFatigueImmediate();
        
        // Changement de la Carte  // + changement Mapping des cases (gerer via hook)
        let carte = this.carteActuelle();
        this.refreshCarte();
        console.log(`OUTRE-REVE || ${this.arpenteur.name} bascule en ${carte} (Climat = ${this.climatActuel()})`); 
        
        // changer les Rencontres
        // this.toggleRencontres(arpenteur);
        return;
    } 
    async clearFlags (init = false) { 
        const confirm = await Dialog.confirm({ 
            content: `Etes-vous sur de vouloir reinitialiser les Flags d'Arpentage pour ${this.arpenteur.name} ? \n (Climat actuel == ${this.climatActuel()})`  })
        if (confirm){ 
            await this.arpenteur.unsetFlag(`a-perte-de-reve`, `isArpenteur`);
            await this.arpenteur.unsetFlag(`a-perte-de-reve`, `Imago`);
            await this.arpenteur.unsetFlag(`a-perte-de-reve`, `Climat`);
            ui.notifications.info(`OUTRE-REVE || Arpenteur - Reset des FLAGs d'arpentage pour ${this.arpenteur.name}`);
            if (init) { Arpenteur.initAll(); }
        }
    }

    refreshCarte(){
        let destination = this.carteActuelle();
        if (this.arpenteur.tmrApp == undefined || this.arpenteur.tmrApp == null) {return;}

        logCEF('refreshCarte - mise a jour de la Carte en destination de ', destination);
        // mise a jour des Rencontres
        game.outreReve.enCEF = this.isImago();
        game.outreReve.CEFRencontres.setTableRencontre(destination);
        // mise a jour de l'image de la Carte
        game.outreReve.EffetsDraconiques.carteTmr = game.outreReve.cartesHR[destination];
        
        // mise a jour des info de tmrDialog
        let message = (destination == "CEF") 
             ? "Les Eaux du Fleuve" 
             : "Les Terres Médianes du Rêve";
        this.arpenteur.tmrApp.pixiTMR.tmrDialog.data.title = message; //besoin de refresh !
        OutreReve.preloadHandlebarsTemplates(destination);
        this.arpenteur.tmrApp.externalRefresh();
        return ;
   }
}