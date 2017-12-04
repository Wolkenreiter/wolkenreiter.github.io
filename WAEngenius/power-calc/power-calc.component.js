/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';

angular.module('waEngineCalc')
    .component('powerCalc', {
        templateUrl: 'power-calc/power-calc.template.html',
        controller: [ '$scope',
                    'configManager',
            function PowerCalcController($scope, configManager) {
                //initialize default engine params
                this.eBasePower = 50;
                this.eComp = {
                    Casing: { matCnt: 200, matType: '', matQ : '1', hasQ: false },
                    'Combustion Internals': {matCnt: 200, matType: '', matQ : '0', hasQ: true },
                    'Mechanical Internals': {matCnt: 150, matType: '', matQ : '0', hasQ: false },
                    Propeller: {matCnt: 100, matType: '', matQ: '0', hasQ: true }
                };
                
                this.$onInit = ()=> {
                    this.powerBoost = {};
                    //query material power boost table from Google spreadsheet
                    sheetrock({
                        url: "https://docs.google.com/spreadsheets/d/1RBskFnl2LbcOv9Dr_eLbeUkFY8h8ZMVhwmT5opuGnNg/edit#gid=0",
                        query: "select B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W limit 12 offset 1",
                        callback: (error, options, response) => {
                            if(!error) {
                                $scope.$apply(() => {
                                    for(var ii = 0; ii<response.rows.length; ii++){
                                        var matName = response.rows[ii].cellsArray[0];
                                        if(!this.powerBoost[matName])
                                            this.powerBoost[matName] = {};
                                        this.powerBoost[matName].unitMass = Number(response.rows[ii].cellsArray[1]);
                                        this.powerBoost[matName].comb = response.rows[ii].cellsArray.slice(2,12).map(Number);
                                        this.powerBoost[matName].prop = response.rows[ii].cellsArray.slice(12).map(Number);
                                    }
                                    for(var c in Object.keys(this.eComp)){
                                        this.eComp[Object.keys(this.eComp)[c]].matType = Object.keys(this.powerBoost)[0];
                                    }
                                });
                            }
                            else
                                alert(error);
                        }
                    });
                    alert(Object.keys(configManager.engineConfigs)[0]);
                };  //this.$onInit
                
                this.getPower = ()=> {
                    try {
                        return this.eBasePower 
                                * (1 
                                + this.powerBoost[this.eComp['Combustion Internals'].matType].comb[this.eComp['Combustion Internals'].matQ]
                                + this.powerBoost[this.eComp.Propeller.matType].prop[this.eComp.Propeller.matQ]);
                    }
                    catch(e) {
                        return 'Invalid or missing engine data';
                    }
                };
                
                this.getMass = ()=> {
                    try {
                        var m = 0;
                        var compKeys = Object.keys(this.eComp);
                        for(var cc in compKeys) {
                            var comp = this.eComp[compKeys[cc]];
                            m += comp.matCnt * this.powerBoost[comp.matType].unitMass;
                        }
                        return m;
                    }
                    catch(e) {
                        return -1;
                    }
                };
            } //this.PowerCalcController
            
        ],
        bindings: {
            getMass: '<',
            getPower: '<'
        }
    }
);