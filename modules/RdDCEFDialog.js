import { RdDTMRDialog } from "/systems/foundryvtt-reve-de-dragon/module/rdd-tmr-dialog.js";
import { PixiTMR } from "/systems/foundryvtt-reve-de-dragon/module/tmr/pixi-tmr.js";
import { SHOW_DICE, SYSTEM_RDD } from "/systems/foundryvtt-reve-de-dragon/module/constants.js";
import { RollDataAjustements } from "/systems/foundryvtt-reve-de-dragon/module/rolldata-ajustements.js";
import { RdDUtility } from "/systems/foundryvtt-reve-de-dragon/module/rdd-utility.js";
import { RdDResolutionTable } from "/systems/foundryvtt-reve-de-dragon/module/rdd-resolution-table.js";
import { RdDTMRRencontreDialog } from "/systems/foundryvtt-reve-de-dragon/module/rdd-tmr-rencontre-dialog.js";
import { ChatUtility } from "/systems/foundryvtt-reve-de-dragon/module/chat-utility.js";
import { RdDRoll } from "/systems/foundryvtt-reve-de-dragon/module/rdd-roll.js";
import { Poetique } from "/systems/foundryvtt-reve-de-dragon/module/poetique.js";
import { EffetsDraconiques } from "/systems/foundryvtt-reve-de-dragon/module/tmr/effets-draconiques.js";
import { Draconique } from "/systems/foundryvtt-reve-de-dragon/module/tmr/draconique.js";
import { HtmlUtility } from "/systems/foundryvtt-reve-de-dragon/module/html-utility.js";
import { ReglesOptionnelles } from "/systems/foundryvtt-reve-de-dragon/module/settings/regles-optionnelles.js";
import { RdDDice } from "/systems/foundryvtt-reve-de-dragon/module/rdd-dice.js";
import { STATUSES } from "/systems/foundryvtt-reve-de-dragon/module/settings/status-effects.js";
import { RdDRencontre } from "/systems/foundryvtt-reve-de-dragon/module/item/rencontre.js";
import { ITEM_TYPES } from "/systems/foundryvtt-reve-de-dragon/module/constants.js";

import { OutreReve } from "/modules/a-perte-de-reve/modules/outrereve.js";
import { cartesHR, CarteCEF } from "/modules/a-perte-de-reve/modules/Carte-CEF.js";
import { CEFRencontres } from "/modules/a-perte-de-reve/modules/rencontre-cef.js";
import { ArpenteurUtility } from "/modules/a-perte-de-reve/modules/arpenteur-utility.js";


export class RdDCEFDialog extends RdDTMRDialog {
    static myTmrApps = new Array(); // liste des instance RdDCEFDialog
    constructor(...args){
        game.outreReve.Arpenteur.initAll();
        super(...args);
        this.fatiguePeriple = 0; 
        this.mesRencontres = {
            nombre : 0,
            liste : []
        }
        RdDCEFDialog.myTmrApps.push(this);
    }
    async close() { 
        const index = RdDCEFDialog.myTmrApps.indexOf(this);
        if (index > -1) { // only splice array when item is found
            //console.log('OUTRE-REVE || RdDCEFDialog closing - splicing ', RdDCEFDialog.myTmrApps[index]);
            RdDCEFDialog.myTmrApps.splice(index, 1);
        }
        return await super.close();
    }
    static async create(actor, tmrData) {
        console.log(`OUTRE-REVE || RdDCEFDialog - creation de RdDCEFDialog pour ${actor.name}. tmr data = `, tmrData);
        if (tmrData.mode != 'visu' && !game.user.isGM) {
            ChatMessage.create({ content: actor.name + " est monté dans les TMR/CEF en mode : " + tmrData.mode, whisper: ChatUtility.getGMs() });
        }
        await PixiTMR.init()
        // let html = await renderTemplate('systems/foundryvtt-reve-de-dragon/templates/dialog-tmr.hbs', tmrData);
        let html = await renderTemplate('/modules/a-perte-de-reve/templates/dialog-cef.hbs', tmrData);
    /** ================================= Currently duplicated .hbs =============================================================
         *  ajouter les modification du Dialog pour ajout du boutton "Bascule" */
        let result = new RdDCEFDialog(html, actor, tmrData);
        RdDCEFDialog.myTmrApps.push(result);
        //console.log('OUTRE-REVE || RdDCEFDialog opening - myTmrApps.length ', RdDCEFDialog.myTmrApps.length);
        actor.CEF.refreshCarte(); // initialise sur la bonne carte
        return result;
    }
    async _jetDeRencontre(tmr){  // from rdd-tmr-dialog - line 669
        let carteActuelle = this.actor.CEF.carteActuelle();
        game.outreReve.CEFRencontres.setTableRencontre(carteActuelle, this.actor);
        // console.log(`OUTRE-REVE || RdDCEFDialog - Jet de Rencontre en ${carteActuelle} : `, tmr);
        let tableRencontre = game.system.rdd.rencontresTMR;
        let rencontre = this.lookupRencontreExistente(tmr);
        if (rencontre) {
          return tableRencontre.calculRencontre(rencontre, tmr);
        }
        const coordTMR = (this.isDemiReveCache()            // -------------------------- fix NAME (CEF)
          ? TMRUtility.getTMRType(tmr.coord) + " ??"         // -------------------------- CEF Utility  --> carteCEF
          : tmr.label + " (" + tmr.coord + ")");             // -------------------------- CEF label
      
        this.setTMRPendingAction({ bringToTop: () => { } })
        const myRoll = await RdDDice.rollTotal((carteActuelle == "TMR") ? "1dt" : "1d8", { showDice: SHOW_DICE });
        this.restoreTMRAfterAction()
        
        let clim = CarteCEF.rencontreSelonClimat(this.actor);
        if (myRoll >= clim.jetRencontre) { 
            this._tellToUser("<b>" + myRoll + ": Rencontre </b> en " + coordTMR + " !!!<br>   <i> " + clim.label + " = rencontre sur " + clim.jetRencontre + "</i>");
            rencontre = await tableRencontre.getRencontreAleatoire(tmr, this.actor.isMauvaiseRencontre());
            if (carteActuelle == "CEF"){
              // OUTRE-REVE: Effet de la rencontre sur le climat
              await CEFRencontres.EffetsImmediatRencontre(this.actor, rencontre);
            }
            this.mesRencontres.nombre += 1;
            this.mesRencontres.liste.push(rencontre.name);
            return rencontre;
        } else {
            this._tellToUser("<b>" + myRoll + ": Pas de rencontre </b> en " + coordTMR + "<br>   <i> " + clim.label + " = rencontre sur " + clim.jetRencontre + "</i>");
            return undefined;
        }
    }
    async manageRencontre(tmr) {
        if (this.viewOnly) {
          return;
        }
        this.descenteTMR = false;
        this.currentRencontre = undefined;
        if (await this._presentCite(tmr)) {
          return;
        }
        this.currentRencontre = await this._jetDeRencontre(tmr);
        if (this.currentRencontre) {
          if (this.rencontresExistantes.find(it => it.id == this.currentRencontre.id)) {
            // rencontre en attente suite à dérobade
            await this.$maitriserRencontre();
          }
          else { // Nouvelle rencontre
            const dialog = new RdDTMRRencontreDialog(this.actor, this.currentRencontre, tmr);
            // OUTRE-REVE : modif du Dialog de rencontre : message et info sur le climat
            if (this.actor.CEF.isImago()) {
                dialog.data.content = this.currentRencontre.msgClimat;
                dialog.data.title = "Rencontre en CEF!";
            }
            // OUTRE-REVE : ajout du boutton de "gestion manuelle" quand opportun
            const btGestionManuelle = { 
              icon: '<i class="fas fa-dice"></i>', 
              label: "Gerer Manuellement", 
              callback: () => dialog.onButtonAction('ignorer')
            }
            if (this.currentRencontre.name == "Epave (ECNI)" || this.currentRencontre.name == "Léviathan (ECSI)"){
                btGestionManuelle.label += "<br><i>(voir le tchat pour info)</i>";
                dialog.data.buttons.maitiser = btGestionManuelle;   // remplace la maitrise par gestion manuelle   ------------ TYPO dans l'original !!! "maitiser"
            } else if (game.settings.get('a-perte-de-reve', 'rencontreManuelle') == true) {
                dialog.data.buttons.manual = btGestionManuelle;      // sinon ajoute l'option manuelle
            }
            await dialog.render(true);
            this.setTMRPendingAction(dialog);
          }
        }
        else {
          this.postRencontre(tmr);
        }
    }
    async declencheSortEnReserve(coord) {
        if (!this.actor.CEF.isImago() || !game.settings.get("a-perte-de-reve", "reserveEnSecurite")){
            super.declencheSortEnReserve(coord);
            return;
        }
        const sorts = this.getSortsReserve(coord);
        if (sorts.length > 0) {
          if (EffetsDraconiques.isSortReserveImpossible(this.actor)) {
            ui.notifications.error("Une queue ou un souffle vous empèche de déclencher de sort!");
            return;
          }
          const reserveSecurite = EffetsDraconiques.isReserveEnSecurite(this.actor);
          const reserveExtensible = this.isReserveExtensible(coord);
          if (!EffetsDraconiques.isUrgenceDraconique(this.actor) ) {
            ChatMessage.create({
              content: await renderTemplate(`modules/a-perte-de-reve/templates/chat-demande-declencher-sortCEF.hbs`, {
                actor: this.actor,
                sorts: sorts,
                coord: coord,
                tete: { reserveSecurite: reserveSecurite, reserveExtensible: reserveExtensible }
              }),
              whisper: ChatUtility.getOwners(this.actor)
            })
            return
          }
          await this.processSortReserve(sorts[0]);
        }
    }
    async _presentCite(tmr) {
      if (this.actor.CEF.carteActuelle() == "TMR"){
        return super._presentCite(tmr);
      }
      const presentCite = this.casesSpeciales.find(c => EffetsDraconiques.presentCites.isCase(c, tmr.coord));
      if (presentCite) {
        const caseData = presentCite;
        const dialog = await this.choisirUnPresentCEF(caseData, 
          present => { // choisir de ceuillir le present
            this._utiliserPresentCite(presentCite, present, tmr)
            this.restoreTMRAfterAction();
          },
          () => {     // OUTRE-REVE : choisir de ne PAS ceuillir le present quand en CEF
            this.restoreTMRAfterAction() 
          }
        );
        this.setTMRPendingAction(dialog);
        await dialog.render();
      }
      return presentCite;
    }

    async choisirUnPresentCEF(casetmr, onChoixPresent, onLaisserPresent = null) { //Hijack de "..tmr/present-cites.js" - line 43
      const presents = await game.system.rdd.rencontresTMR.getPresentsCite();
      const buttons = {};
      presents.forEach(r =>  buttons['present'+r.id] = { icon: '<i class="fas fa-check"></i>', label: r.name, callback: async () => onChoixPresent(r) });
      buttons["btLaisser"] = { icon: '<i class="fas fa-hourglass"></i>', label: "Laisser le présent en TMR", callback: () => onLaisserPresent() }; // OUTRE-REVE add

      let dialog = new Dialog({
        title: "Présent des cités",
        content: `La cité jumelée en TMR contient un présent qui vous est destiné. <br>Voulez-vous le ceuillir ?`,    // OUTRE-REVE text update
        buttons: buttons
      });
      await dialog.render(true);
      return dialog
    }

    async _deplacerDemiReve(...args){
        await super._deplacerDemiReve(...args);
        await this.gestionFatigueImmediate();
    }
    async gestionFatigueImmediate(){
        if (this.actor.CEF.isImago() === true && game.settings.get("a-perte-de-reve", "fatigueImmediate")){
            // logCEF(`gestionFatigueImmediate : -${this.cumulFatigue} /${this.actor.system.sante.fatigue.value}`);
            if (this.cumulFatigue || ReglesOptionnelles.isUsing("appliquer-fatigue")){
                await this.actor.santeIncDec("fatigue", this.cumulFatigue);
                this.fatiguePeriple += this.cumulFatigue;
                this.cumulFatigue = 0;
            }
            this.$updateValuesDisplay();
            // this.actor.notifyRefreshTMR(); //socket
        }
    }
    async activateListeners(html) {
        await super.activateListeners(html);
        this.html = html;
        // Activer buttons
        this.html.find('.basculerTMR').click(event => this.actor.CEF.basculerTmrCEF());
        this.html.find('.basculerCEF').click(event => this.actor.CEF.basculerTmrCEF());
        
        // Gestion du cout de montée en points de rêve
        await this.gestionFatigueImmediate();

        html.on("click", '.declencher-sort-reserve', event => {
          let coord = event.currentTarget.attributes['data-tmr-coord'].value;
          let sortId = event.currentTarget.attributes['data-sort-id'].value;
          let actorId = event.currentTarget.attributes['data-actor-id'].value;
          let actor = game.actors.get(actorId);
          actor.tmrApp.lancerSortEnReserve(coord, sortId);
          // TODO: supprimer le message?
        });
    
        // Le reste...
        this.$updateValuesDisplay();
        // this.actor.notifyRefreshTMR();
    }
    async $updateValuesDisplay() {
      // console.log("CEFdialog.$updateValuesDisplay()");
        await super.$updateValuesDisplay();
        if (this.viewOnly || !this.rendered) {
            return;
        }
        
        // Afficher sorts en Reserve
        const coord = this._getCoordActor();
        const sorts = this.getSortsReserve(coord);
        
        HtmlUtility.showControlWhen(this.html.find(".sort-en-reserve"), sorts.length > 0 );
        HtmlUtility.showControlWhen(this.html.find(".info-climat"), this.actor.CEF.isArpenteur() );
        HtmlUtility.showControlWhen(this.html.find(".basculerCEF"), !this.actor.CEF.isImago() && this.actor.CEF.peutBasculer() );
        HtmlUtility.showControlWhen(this.html.find(".basculerTMR"), this.actor.CEF.isImago() && this.actor.CEF.peutBasculer());
        HtmlUtility.showControlWhen(this.html.find(".lire-signe-draconique"), this.actor.isResonanceSigneDraconique(this._getCoordActor()));

        console.log("this._getCoordActor()", this._getCoordActor());

        // Afficher les "Periples du Voyage"
        let climat = document.getElementById("cef-climat-value");
            climat.innerHTML = RDD_CEF.Climat[this.actor.CEF.climatActuel()].label;
        let climatVisu = document.getElementById("cef-climat-visu-value");
            climatVisu.innerHTML = RDD_CEF.Climat[this.actor.CEF.climatActuel()].visu;
        let risqueRencontre = document.getElementById("cef-rencontre-value");
            risqueRencontre.innerHTML = `Rencontre sur ${RDD_CEF.Climat[this.actor.CEF.climatActuel()].jetRencontre}+`;
        let fatigueTotPeriple = document.getElementById("tmr-ptsfatigueperiple-value");
            fatigueTotPeriple.innerHTML = this.fatiguePeriple + this.cumulFatigue;
        let lesRencontres = document.getElementById("tmr-rencontres-value");
            lesRencontres.innerHTML = this.mesRencontres.nombre; //`${this.mesRencontres.nombre}<br>(${this.mesRencontres.liste})`;
        
        if (sorts.length > 0){
          let lesSortsEnReserve = document.getElementById("tmr-sort-reserve-value");
            lesSortsEnReserve.innerHTML = await renderTemplate(`modules/a-perte-de-reve/templates/sort-en-reserve-CEF.hbs`, {
              actor: this.actor,
              sorts: sorts,
              coord: coord,
            });
        }
        // Afficher la fatigue cumulee (et autres infos)      
        if (ReglesOptionnelles.isUsing("appliquer-fatigue")) { //done in SUPER mais besoin de refaire pour la fatigue cumulee
            let fatigueItem = document.getElementById("tmr-fatigue-table");
            fatigueItem.innerHTML = "<table class='table-fatigue'>" + RdDUtility.makeHTMLfatigueMatrix(this.actor.system.sante.fatigue.value, this.actor.system.sante.endurance.max, this.cumulFatigue).html() + "</table>";
        }
        await ArpenteurUtility.refresh(this.actor);
    }
}