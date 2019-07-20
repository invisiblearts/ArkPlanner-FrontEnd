<template lang='pug'>
div#app
    el-container
        el-header
            arkplanner-header
        el-main
            el-row(style="display: flex; flex-wrap: wrap; justify-content: center;")
                el-card(v-for="material in materialList" v-bind:key='material.id' :class='`rarity-` + material.rarity')
                    div(slot='header' class='clearfix' style='display: flex; align-items: center;')
                        img(:src='material.iconPath')
                        span(style='margin-left: 10px; font-size: 18px;') {{material.name}}
                    div
                        div(style="display: inline-block;") 需要#[el-input-number(v-model='material.required' :min='0' size='small') ]
                        div(style="display: inline-block;") 已有#[el-input-number(v-model='material.owned'  :min='0' size='small')]

        el-footer
            arkplanner-footer
        el-button(type="primary" icon="el-icon-data-analysis" circle id="analyze" @click='analyze')
        el-button(icon="el-icon-more" circle id="importOrExport" @click='toggleImportOrExport')

        el-dialog(:title='`预计需要体力: ` + cost' :visible.sync="resultVisible" width="80%")
            el-tabs(v-model="activeResult")
                el-tab-pane(label='关卡列表' name='stagesList')
                    p 共计获得 #[b {{gold}} 龙门币] 以及作战录像 #[b {{exp}} EXP]
                    p(v-for='_stage in stages') #[b {{_stage.stage}}]: {{_stage.count}} 次，获得 
                        span(v-for='key in Object.keys(_stage.items)') #[b {{key}}]({{_stage.items[key]}}) 
                el-tab-pane(label='合成列表' name='syntheses')
                    p(v-if="extraOutc") 由于考虑了合成副产物的产出，可能会出现提示合成你不需要的材料的情况，在需求量较小的时候建议关闭合成副产物。
                    p(v-for="synthesis in syntheses") #[b {{synthesis.target}}]({{synthesis.count}}): 
                        span(v-for="key in Object.keys(synthesis.materials)") #[b {{key}}]({{synthesis.materials[key]}}) 
                el-tab-pane(label='素材价值' name='itmvalues')
                    p(v-for='group in itmvalues') 素材等级#[b {{group.level}}]: <br/>
                        span(v-for='value in group.values') {{value.item}}(#[b {{value.value}}]) 
        
        el-dialog(title='杂项/设置' :visible.sync="ioVisible" width="80%")
            el-tabs(v-model="activeSetting")
                el-tab-pane(label='导入数据' name='importJSON')               
                    div(style="margin: 10px") 
                        el-input(v-model='materialJSON' type='textarea' :rows='5' placeholder='[{"name":"双极纳米片","need":4,"have":0},{"name":"D32钢","need":4,"have":0}...]')
                    div(style="margin: 10px") 
                        el-button(type="primary" plain @click='applyJSON') 导入
                el-tab-pane(label='导出数据' name='exportJSON')
                    div(style="margin: 10px")
                        el-input(v-model='materialExportJSON' type='textarea' :rows='5' readonly=true)
                el-tab-pane(label='参数设置' name='planningParameters')
                    p 材料排列顺序
                        span(style="margin: 8px")
                        el-radio-group(v-model='sortingOrder')
                            el-radio-button(label='byType') 按类型
                            el-radio-button(label='byRarity') 按稀有度
                    p 计算合成副产物
                        span(style="margin: 8px")
                        el-switch(v-model='extraOutc' active-color='#13ce66' inactive-color='#e0e0e0')
                    p 大量需求经验
                        span(style="margin: 8px")
                        el-switch(v-model='expDemand' active-color='#13ce66' inactive-color='#e0e0e0')
                    p 大量需求龙门币
                        span(style="margin: 8px")
                        el-switch(v-model='goldDemand' active-color='#13ce66' inactive-color='#e0e0e0')
                el-tab-pane(label='导入预设' name='importPreset')
                    div(style="margin: 10px") 
                        el-button(type="primary" plain @click='importFullRequirement') 导入全需求





</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ArkplannerHeader from './components/Header.vue';
import ArkplannerFooter from './components/Footer.vue';

import getMaterialsList, { Material } from './Material';

import * as fullRequirementSource from './assets/fully_required.json';

const assemblePostData = (materialList: Material[], extraOutc: boolean, expDemand: boolean, goldDemand: boolean) => {
    const obj = {
        required: {},
        owned: {},
        extra_outc: extraOutc,
        exp_demand: expDemand,
        gold_demand: goldDemand,
    };

    for (const material of materialList) {
        if (Math.floor(material.required) > 0) {
            (obj.required as any)[material.name] = Math.floor(material.required);
        }
        if (Math.floor(material.owned) > 0) {
            (obj.owned as any)[material.name] = Math.floor(material.owned);
        }
    }

    return obj;
};


@Component({
    components: {
        ArkplannerHeader,
        ArkplannerFooter,
  },
})
export default class App extends Vue {
    public materialListSource = getMaterialsList();
    get materialList() {
        if (this.sortingOrder === 'byRarity') {
            return this.materialListSource.sort((a: Material, b: Material) =>  b.rarity - a.rarity);
        } else {
            return this.materialListSource.sort((a: Material, b: Material) =>  b.id - a.id);
        }
    }
    public materialJSON = '';
    public materialExportJSON = '';

    public sortingOrder = 'byType';

    public cost = 0;
    public gold = 0;
    public exp = 0;

    public ioVisible = false;
    public activeSetting = 'importJSON';
    public extraOutc = false;
    public expDemand = false;
    public goldDemand = true;

    public resultVisible = false;
    public activeResult = 'stagesList';

    public stages: any = [];
    public syntheses: any = [];
    public itmvalues: any = [];



    public analyze() {
        const req = new XMLHttpRequest();
        req.open('POST', 'plan/', true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.onreadystatechange = () => {
            const result = JSON.parse(req.responseText);
            this.cost = result.cost;
            this.gold = result.gold;
            this.exp = result.exp;
            this.stages = result.stages;
            this.syntheses = result.syntheses;
            this.itmvalues = result.values;
            this.resultVisible = true;
        };
        req.send(JSON.stringify(assemblePostData(this.materialList, this.extraOutc, this.expDemand, this.goldDemand)));
    }

    public applyJSON() {
        const materialImportList = JSON.parse(this.materialJSON);
        const requiredMap: { [key: string]: number; } = {};
        const ownedMap: { [key: string]: number; } = {};
        for (const materialImport of materialImportList) {
            requiredMap[materialImport.name] = materialImport.need;
            ownedMap[materialImport.name] = materialImport.have;
        }
        for (const material of this.materialList) {
            if (material.name in ownedMap) {
                material.owned = ownedMap[material.name];
                material.required = requiredMap[material.name];
            }
        }
        this.ioVisible = false;
    }

    public importFullRequirement() {
        const materialImportList = (fullRequirementSource as any).default;
        const requiredMap: { [key: string]: number; } = {};
        const ownedMap: { [key: string]: number; } = {};
        for (const materialImport of materialImportList) {
            requiredMap[materialImport.name] = materialImport.need;
            ownedMap[materialImport.name] = materialImport.have;
        }
        for (const material of this.materialList) {
            if (material.name in ownedMap) {
                material.owned = ownedMap[material.name];
                material.required = requiredMap[material.name];
            }
        }

    }

    public toggleImportOrExport() {
        const materialExportList = [];
        for (const material of this.materialList) {
            if (material.required > 0 || material.owned > 0) {
                const materialExport: { [key: string]: any; }
                 = {name: material.name, need: material.required, have: material.owned};
                materialExportList.push(materialExport);
            }
        }
        this.materialExportJSON = JSON.stringify(materialExportList);
        this.ioVisible = true;
    }

}
</script>

<style lang="stylus">
body
    margin 0
    font 14px "Source Sans Pro", "Helvetica Neue", Helvetica, "Source Han Sans CN", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif
    background-color rgb(244, 244, 245)

.el-header
    font-size 120%
    padding-left 15% !important
    font-weight lighter
    color white
    background-color #409EFF
    width 100%
    line-height 60px

.el-main
    padding 0 !important
    background-color rgb(236, 245, 255)
.el-card
    width 380px
    display inline-block
    margin: 10px
.el-input-number
    margin 5px

.el-card img 
    width 40px
    height 40px

.el-card.rarity-4
    border 1px solid #f9cb03
.el-card.rarity-3
    border 1px solid #e2b7f3
.el-card.rarity-2
    border 1px solid #1fa8db
.el-card.rarity-1
    border 1px solid #d2ef1d
.el-card.rarity-0
    border 1px solid #838383

#analyze
    position fixed
    right 30px
    bottom 30px
    font-size 40px
    z-index 100
    box-shadow 2px 1px 1px rgb(217, 236, 255)
#importOrExport
    position fixed
    right 35px
    bottom 120px
    font-size 20px
    z-index 100
    box-shadow 2px 1px 1px rgb(217, 236, 255)

</style>
