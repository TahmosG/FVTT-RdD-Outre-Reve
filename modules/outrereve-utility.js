/**
 * Ajout de la fatigue accumulee sur la table de Fatigue TMR.
 * en compelement avec RdDCEFDialog 
 *      - constructor
 *      - _jetDeRencontre(tmr){
 *      - $updateValuesDisplay 
 */

import "/systems/foundryvtt-reve-de-dragon/module/rdd-utility.js";
import { RdDUtility } from "/systems/foundryvtt-reve-de-dragon/module/rdd-utility.js";

/* -----------DATA DU SYSTEME RDD------------------- */
                            function _buildAllSegmentsFatigue(max) {
                                const cycle = [5, 2, 4, 1, 3, 0];
                                const fatigue = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
                                for (let i = 0; i <= max; i++) {
                                const ligneFatigue = foundry.utils.duplicate(fatigue[i]);
                                const caseIncrementee = cycle[i % 6];
                                ligneFatigue[caseIncrementee]++;
                                ligneFatigue[caseIncrementee + 6]++;
                                ligneFatigue.fatigueMax = 2 * (i + 1);
                                fatigue[i + 1] = ligneFatigue;
                                }
                                return fatigue;
                            }
                            
                            /* -------------------------------------------- */
                            function _cumulSegmentsFatigue(matrix) {
                                let cumulMatrix = [];
                                for (let line of matrix) {
                                let cumul = foundry.utils.duplicate(line);
                            
                                for (let i = 1; i < 12; i++) {
                                    cumul[i] += cumul[i - 1];
                                }
                                cumulMatrix.push(cumul);
                                }
                                return cumulMatrix;
                            }
                            
                            /* -------------------------------------------- */
                            export const MAX_ENDURANCE_FATIGUE = 60;
                            const fatigueMatrix = _buildAllSegmentsFatigue(MAX_ENDURANCE_FATIGUE);
                            const cumulFatigueMatrix = _cumulSegmentsFatigue(fatigueMatrix);
                            
                            const fatigueMalus = [0, 0, 0, -1, -1, -1, -2, -3, -4, -5, -6, -7]; // Provides the malus for each segment of fatigue
                            const fatigueLineSize = [3, 6, 7, 8, 9, 10, 11, 12];
                            const fatigueLineMalus = [0, -1, -2, -3, -4, -5, -6, -7];
/* ------------FIN DATA DU SYSTEME RDD---------------------- */

export class OutreReveUtility extends RdDUtility{
    /* -------------------------------------------- */
    // Build the nice (?) html table used to manage fatigue.
    // max should be the endurance max value
    static makeHTMLfatigueMatrix(fatigue, maxEndurance, cumul) {
        const segments = RdDUtility.getSegmentsFatigue(maxEndurance);
        return this.makeHTMLfatigueMatrixForSegment(fatigue, segments, cumul);
    }

    /* -------------------------------------------- */
    static makeHTMLfatigueMatrixForSegment(fatigue, segments, cumul) {
        fatigue = Math.max(fatigue, 0);
        fatigue = Math.min(fatigue, segments.fatigueMax);

        let table = $("<table/>").addClass('table-fatigue');
        let segmentIdx = 0;
        let fatigueCount = 0;
        for (var line = 0; line < fatigueLineSize.length; line++) {
        let row = $("<tr/>");
        let segmentsPerLine = fatigueLineSize[line];
        row.append("<td class='fatigue-malus'>" + fatigueLineMalus[line] + "</td>");
        while (segmentIdx < segmentsPerLine) {
            let freeSize = segments[segmentIdx];
            for (let col = 0; col < 5; col++) {
                if (col < freeSize) {
                    if (fatigueCount < fatigue) 
                        row.append("<td class='fatigue-used'>X</td>");
            // OUTRE-REVE : ajout de marqueurs pour fatigue cumulee mais non-encaissee (var cumul)
                    else if (fatigueCount < fatigue + cumul)
                        row.append("<td class='fatigue-free'>X</td>");
            // OUTRE-REVE : fin de l'ajout
                    else
                        row.append("<td class='fatigue-free'/>");
                    fatigueCount++;
                } else {
                    row.append("<td class='fatigue-none'/>");
                }
            }
            row.append("<td class='fatigue-separator'/>");
            segmentIdx = segmentIdx + 1;
        }
        table.append(row);
        }
        return table;
    }
}
// overide des methodes pour afficher la table de fatigue avancee
RdDUtility.makeHTMLfatigueMatrix = OutreReveUtility.makeHTMLfatigueMatrix;
RdDUtility.makeHTMLfatigueMatrixForSegment = OutreReveUtility.makeHTMLfatigueMatrixForSegment;