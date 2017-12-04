/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
angular.module('waEngineCalc').component('engineSchemEditor', {
    templateUrl: 'engine-schem-editor/engine-schem-editor.template.html',
    bindings: {
        engineSchemData: '<'
    },
    
    controller: [ '$scope',
        function($scope) {
            this.updateEngineSchem = () => {
                console.log('updating Schematic: ' + this.engineSchemData.baseStats.power);
                $scope.$emit('engineSchem:changed',{engineSchemData: this.engineSchemData});
            };
        }
    ]
});

