<template lang='pug'>
div#app
    el-container
        el-header
            arkplanner-header
        el-main
            el-row(style="display: flex; flex-wrap: wrap; justify-content: center;")
                div(style="margin: 10px")
                    el-switch(v-model='extra_outc_bool' active-color='#13ce66' inactive-color='#e0e0e0' active-text='计算合成副产物')
                div(style="margin: 10px")
                    el-switch(v-model='exp_demand_bool' active-color='#13ce66' inactive-color='#e0e0e0' active-text='大量需求经验')
                div(style="margin: 10px")
                    el-switch(v-model='gold_demand_bool' active-color='#13ce66' inactive-color='#e0e0e0' active-text='大量需求龙门币')
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
                    p() 共计获得#[b 龙门币] {{gold}} 以及价值 {{exp}} EXP 的#[b 录像带]
                    p(v-for='_stage in stages') #[b {{_stage.stage}}]: {{_stage.count}} 次，获得 
                        span(v-for='key in Object.keys(_stage.items)') #[b {{key}}]({{_stage.items[key]}}) 
                el-tab-pane(label='合成列表' name='syntheses')
                    p(v-if="extra_outc_bool") 由于考虑了合成副产物的产出，可能会出现提示合成不需要的材料，在需求量较小的时候建议关闭合成副产物
                    p(v-for="synthesis in syntheses") #[b {{synthesis.target}}]({{synthesis.count}}): 
                        span(v-for="key in Object.keys(synthesis.materials)") #[b {{key}}]({{synthesis.materials[key]}}) 
                el-tab-pane(label='素材价值' name='itmvalues')
                    p(v-for='group in itmvalues') 素材等级#[b {{group.level}}]: <br/>
                        span(v-for='value in group.values') {{value.item}}(#[b {{value.value}}]) 
        
        el-dialog(title='导入/导出' :visible.sync="ioVisible" width="80%")
            el-tabs(v-model="activeIO")
                el-tab-pane(label='导入' name='importJSON') 
                    div(style="margin: 10px") 
                        el-input(v-model='materialJSON' type='textarea' :rows='5' placeholder='[{"name":"双极纳米片","need":4,"have":0},{"name":"D32钢","need":4,"have":0}...]')
                    div(style="margin: 10px") 
                        el-button(type="primary" plain @click='applyJSON') 导入
                el-tab-pane(label='导出' name='exportJSON') 
                    div(style="margin: 10px")
                        el-input(v-model='materialExportJSON' type='textarea' :rows='5' readonly=true)


</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ArkplannerHeader from './components/Header.vue';
import ArkplannerFooter from './components/Footer.vue';
import HelloWorld from './components/HelloWorld.vue';

import getMaterialsList, { Material } from './Material';

const assemblePostData = (materialList: Material[], extra_outc_bool: any, exp_demand_bool: any, gold_demand_bool: any) => {
    const obj = {
        required: {},
        owned: {},
        extra_outc: extra_outc_bool,
        exp_demand: exp_demand_bool,
        gold_demand: gold_demand_bool,
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
        HelloWorld,
        ArkplannerHeader,
        ArkplannerFooter,
  },
})
export default class App extends Vue {
    public materialList = getMaterialsList().sort((a: Material, b: Material) =>  b.rarity - a.rarity);
    public materialJSON = '';
    public materialExportJSON = '';
    public cost = 0;
    public gold = 0;
    public exp = 0;

    public ioVisible = false;
    public activeIO = 'importJSON';
    public extra_outc_bool = false;
    public exp_demand_bool = true;
    public gold_demand_bool = true;

    public resultVisible = false;
    public activeResult = 'stagesList';

    public stages: any = [];
    public syntheses: any = [];
    public itmvalues: any = [];

    public applyJSON() {
        const materialImportList = JSON.parse(this.materialJSON);
        let required_map: { [key: string]: number; } = {};
        let owned_map: { [key: string]: number; } = {};

        for (let materialImport of materialImportList) {
            required_map[materialImport.name] = materialImport.need;
            owned_map[materialImport.name] = materialImport.have;
        }

        for (let material of this.materialList) {
            if (material.name in owned_map) {
                material.owned = owned_map[material.name];
                material.required = required_map[material.name];
            }
        }
        this.ioVisible = false;
    }

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
        req.send(JSON.stringify(assemblePostData(this.materialList, this.extra_outc_bool, this.exp_demand_bool, this.gold_demand_bool)));
    }

    public toggleImportOrExport() {
        let materialExportList = [];
        for (let material of this.materialList) {
            if (material.required > 0 || material.owned > 0) {
                let materialExport: { [key: string]: any; } = {'name':material.name, 'need':material.required, 'have':material.owned};
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
    background-color #001429
    width 100%
    line-height 55px

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
