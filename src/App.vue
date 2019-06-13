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
                    p(v-for='_stage in stages') #[b {{_stage.stage}}]: {{_stage.count}} 次，获得 
                        span(v-for='key in Object.keys(_stage.items)') #[b {{key}}]({{_stage.items[key]}}) 
                el-tab-pane(label='合成列表' name='syntheses')
                    p(v-for="synthesis in syntheses") #[b {{synthesis.target}}]({{synthesis.count}}): 
                        span(v-for="key in Object.keys(synthesis.materials)") #[b {{key}}]({{synthesis.materials[key]}}) 
        
        el-dialog(title='导入/导出' :visible.sync="ioVisible" width="80%")
            el-tabs(v-model="activeIO")
                el-tab-pane(label='导入' name='importJSON') Pending Implementation
                el-tab-pane(label='导出' name='exportJSON') Pending Implementation


</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ArkplannerHeader from './components/Header.vue';

import ArkplannerFooter from './components/Footer.vue';
import HelloWorld from './components/HelloWorld.vue';

import getMaterialsList, { Material } from './Material';

const assemblePostData = (materialList: Material[]) => {
    const obj = {
        required: {},
        owned: {},
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
    public cost = 0;

    public ioVisible = false;
    public activeIO = 'importJSON';

    public resultVisible = false;
    public activeResult = 'stagesList';

    public stages: any = [];
    public syntheses: any = [];

    public analyze() {
        const req = new XMLHttpRequest();
        req.open('POST', 'https://ak.inva.land/plan/', true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.onreadystatechange = () => {
            const result = JSON.parse(req.responseText);
            this.cost = result.cost;
            this.stages = result.stages;
            this.syntheses = result.syntheses;
            this.resultVisible = true;
        };
        req.send(JSON.stringify(assemblePostData(this.materialList)));
    }

    public toggleImportOrExport() {


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
