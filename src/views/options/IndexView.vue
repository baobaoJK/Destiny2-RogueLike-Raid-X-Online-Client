<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import {
  getRaidMapImg,
  getSocket,
} from '@/utils'
import { ElMessage } from 'element-plus'
import ChangeValue from './components/ChangeValue.vue'
import InfoBoard from '@/components/infoboard/IndexView.vue'

// 父组件信息
const props = defineProps<{
  roomConfig: any,
  playerConfig: any,
  infoBoard: any,
  setWebLoading: (status: boolean) => void,
}>()

const roomConfig: any = computed(() => props.roomConfig)
const playerConfig: any = computed(() => props.playerConfig)
const infoBoard: any = computed(() => props.infoBoard)
const setWebLoading = (status: boolean) => props.setWebLoading(status)

// 突袭信息阶段
const raidConfigStage = computed(() => {
  return (props.roomConfig?.raidConfig === undefined || props.roomConfig?.raidConfig === null) ? true : false
})
// 玩家信息
const playerConfigStage = computed(() => {
  return (props.playerConfig?.playerStatus === undefined || props.playerConfig?.playerStatus === null) ? true : false
})

// socket
let socket: any

// 游戏挑战信息
const gameChallengeData = ref([
  {
    mapName: '最后一愿',
    level: '普通',
    name: '未来愿望',
    description: '去许愿墙播放《未来愿望》，获得 3 个货币'
  },
  {
    mapName: '救赎花园',
    level: '简单',
    name: '乔装打扮',
    description: '装备 Vex 外形的护甲（幻化）完成开门关（有多少穿多少），获得 3 个货币'
  },
  {
    mapName: '深岩墓室',
    level: '普通',
    name: '深海派克',
    description: '运送 n 辆派克抵达终点，则获得 n 个货币'
  },
  {
    mapName: '玻璃拱顶',
    level: '简单',
    name: '完美塔防',
    description: '防守区域时，没有任何米诺陶进入区域重置节点时，可以获得 3 个货币'
  },
  {
    mapName: '门徒誓约',
    level: '困难',
    name: '完好无损',
    description: '运送目标时，没有任何人死亡，可以获得 6 个货币'
  },
  {
    mapName: '国王的陨落',
    level: '困难',
    name: '接触暗影',
    description:
      '开门关时，不破坏黑球的情况下完成开门关，可以获得 6 个货币或单左双右完成开门关，可以获得 3 个货币'
  },
  {
    mapName: '梦魇根源',
    level: '简单',
    name: '蔷薇绽放',
    description: '在进入突袭后，每个人猜花的颜色，例如 [黑，白，黑]（一共有 8 种组合），把要猜的颜色打在公屏上，猜完后前往花坛看三朵花的颜色，如果谁猜对了，那么获得他身上号码所对应的数量货币'
  },
  {
    mapName: '克洛塔的末日',
    level: '普通',
    name: '一次机会',
    description: '开门关只能使用一次启迪，之后不能再获得启迪，并且不能有人死亡，完成可以获得 6 个币'
  }
])

// 地图列表
const mapList: any = ref([])

// 提示框
const mapDialogVisible = ref(false)
const valueDialog = ref()
const valueDialogTitle = ref('')

// 按钮
const mapDoorButtonDisabled = computed(() => {
  return roomConfig.value.roomStage === "next" ? true : false
})
const mapNextButtonDisabled = computed(() => {
  return roomConfig.value.roomStage === "door" ? true : false
})
const chestNextButtonDisabled = ref(false)
const flawlessButtonDisabled = ref(false)

// 地图名称
const mapName = computed(() => {
  if (raidConfigStage.value) {
    return '请选择地图'
  }

  return roomConfig.value.raidConfig.raidName
})

// 地图步骤条
// -----------------------------------------------------
// 步骤
const mapSteps = computed(() => {
  if (raidConfigStage.value) {
    return 1
  }

  return roomConfig.value.raidConfig.raidLevel
})
// 步骤数
const mapStepNum = computed(() => {
  if (raidConfigStage.value) {
    return 1
  }

  return roomConfig.value.raidConfig.raidLevelPoint + 1
})
// 步骤条每一步长度
const mapStepWidth = computed(() => {
  if (raidConfigStage.value) {
    return 0
  }

  return 100 / Number(mapSteps.value)
})

// 隐藏箱进度条
// -----------------------------------------------------
// 步骤
const chestSteps = computed(() => {
  if (playerConfigStage.value) {
    return 1
  }

  return roomConfig.value.raidConfig.raidChest
})
// 步骤数
const chestStepNum = computed(() => {
  if (playerConfigStage.value) {
    return 1
  }

  return playerConfig.value.raidChest + 1
})
// 步骤条每一步长度
const chestStepWidth = computed(() => {
  if (playerConfigStage.value) {
    return 0
  }

  return 100 / Number(chestSteps.value)
})

// 打开选择地图模态框
const openMapDialog = () => {
  // 判断是否为队长
  if (!playerConfig.value.isCaptain) return
  mapDialogVisible.value = true

  setWebLoading(true)
  socket.emit('getMapList', {
    roomId: roomConfig.value.roomId
  })
}

// 选择地图
const setMapById = (mapId: string) => {
  setWebLoading(true)
  socket.emit('setMap', {
    roomId: roomConfig.value.roomId,
    mapId: mapId
  })

  mapDialogVisible.value = false
}

// 检测地图
const checkRaidMap = () => {
  // 判断突袭地图是否为空
  if (roomConfig.value.raidConfig === undefined || roomConfig.value.raidConfig === null) {
    ElMessage({
      message: '请先选择地图',
      grouping: true,
      type: 'error'
    })

    return true
  }
  return false
}

// 遭遇战插旗点
const mapDoor = () => {
  // 检测地图是否为空
  if (checkRaidMap()) return

  setWebLoading(true)
  socket.emit('mapDoor', {
    roomId: roomConfig.value.roomId
  })
}

// 遭遇战完成按钮
const mapNext = () => {

  // 判断突袭地图是否非空
  if (checkRaidMap()) return

  setWebLoading(true)
  socket.emit('mapNext', {
    roomId: roomConfig.value.roomId
  })
}

// 获取隐藏箱事件
const nextChest = () => {
  // 判断突袭地图是否为空
  if (checkRaidMap()) return

  setWebLoading(true)
  socket.emit('getChest', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName
  })

  chestNextButtonDisabled.value = true
  const changeButtonState = setTimeout(() => {
    chestNextButtonDisabled.value = false
    clearInterval(changeButtonState)
  }, 3000)
}

// 显示修改数量模态框
const showDialog = (type: string) => {
  // 判断突袭地图是否为空
  if (checkRaidMap()) return

  // 判断是什么类型的模态框
  if (type == 'money') {
    valueDialogTitle.value = '设置货币数量'
  } else if (type == 'draw') {
    valueDialogTitle.value = '设置抽卡次数'
  }

  // 打开模态框
  valueDialog.value.open(type)
}

// 无暇按钮
const flawlessButton = () => {
  // 判断突袭地图是否为空
  if (checkRaidMap()) return

  setWebLoading(true)
  socket.emit('flawless', {
    "roomId": roomConfig.value.roomId
  })

  // 更改按钮状态
  flawlessButtonDisabled.value = true
  const changeButtonState = setTimeout(() => {
    flawlessButtonDisabled.value = false
    clearInterval(changeButtonState)
  }, 3000)
}

// 初始化
const initOptions = () => {
  socket = getSocket()

  socket.off('getMapList')
  socket.on('getMapList', (data: any) => {
    console.log(data)
    mapList.value = data.mapList
    setWebLoading(false)
  })
}
initOptions()

const isLoading = ref(true)
watch(
  () => [props.roomConfig, props.playerConfig],
  () => {
    if (props.roomConfig !== undefined && props.playerConfig !== undefined) {
      isLoading.value = false
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
);
</script>
<template>
  <div id="options" v-loading.fullscreen.lock="isLoading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <div class="map-pane">
      <div class="map-info">
        <div class="map-img" @click="openMapDialog">
          <img :src="getRaidMapImg(mapName)" alt="地图" />
        </div>
        <p class="map-text">- {{ mapName }} -</p>
        <button class="button map-button" @click="openMapDialog" v-if="playerConfig?.isCaptain">选择地图</button>
      </div>

      <div class="map-level-box">
        <p>-遭遇战通关进度-</p>
        <div class="map-step-bar">
          <div class="map-bar" :style="{ width: (mapStepNum - 1) * mapStepWidth + '%' }"></div>
          <div class="step map-step" v-for="index in mapSteps + 1" :key="index"
            :class="{ active: mapStepNum >= index }">
            {{ index - 1 }}
          </div>
        </div>
        <div class="step-options map-options" v-if="playerConfig?.isCaptain">
          <button class="button" id="map-door" @click="mapDoor" :disabled="mapDoorButtonDisabled">
            抵达遭遇战插旗点
          </button>
          <button class="button" id="map-next" @click="mapNext" :disabled="mapNextButtonDisabled">
            遭遇战完成
          </button>
        </div>
      </div>

      <div class="map-chest-box">
        <p>-隐藏箱进度-</p>
        <div class="chest-step-bar">
          <div class="chest-bar" :style="{ width: (chestStepNum - 1) * chestStepWidth + '%' }"></div>
          <div class="step map-step" v-for="index in chestSteps + 1" :key="index"
            :class="{ active: chestStepNum >= index }">
            {{ index - 1 }}
          </div>
        </div>
        <div class="step-options chest-options">
          <button class="button" id="chest-next" @click="nextChest" :disabled="chestNextButtonDisabled">
            已获取隐藏箱
          </button>
        </div>
      </div>
    </div>

    <div class="options-pane">
      <button class="button" id="money-button" @click="showDialog('money')">设置货币数量</button>
      <button class="button" id="card-button" @click="showDialog('draw')">设置抽卡次数</button>
      <button class="button" id="flawless" @click="flawlessButton" :disabled="flawlessButtonDisabled"
        v-if="playerConfig?.isCaptain">
        无暇通关（全员无暇 加 6 货币）
      </button>
    </div>

    <!-- 地图选择模态框 -->
    <el-dialog class="dialog map-dialog" v-model="mapDialogVisible" :close-on-click-modal="false" width="75rem"
      align-center>
      <div class="map-title">
        <h1>选择游戏地图</h1>
      </div>

      <div class="map-list-box">

        <div class="map-item" v-for="(map, index) in mapList" :key="index" @click="setMapById(map.raidId)">
          <img :src="getRaidMapImg(map.raidName)" :alt="map.raidName" />
          <p>{{ map.raidName }}</p>
        </div>

      </div>

      <div class="map-confirm-box">
        <button type="button" class="button map-cancel" @click="mapDialogVisible = false">
          关闭
        </button>
      </div>
    </el-dialog>

    <ChangeValue ref="valueDialog" :playerConfig="playerConfig" :setWebLoading="setWebLoading"
      :title="valueDialogTitle"></ChangeValue>

    <!-- 游戏挑战信息版 -->
    <InfoBoard type="left" :show-info-board="infoBoard.gameChallenge">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gameChallenge = !infoBoard.gameChallenge">{{
            infoBoard.gameChallenge ? '关闭' : '查看游戏挑战'
            }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">游戏挑战</h1>
      </template>
      <template #content>
        <div>
          <div v-for="item in gameChallengeData" :key="item.mapName">
            <p class="title">{{ item.mapName }} - {{ item.level }} - {{ item.name }}</p>
            <p class="description">{{ item.description }}</p>
            <hr />
          </div>
        </div>
      </template>
    </InfoBoard>

    <!-- 游戏规则信息版 -->
    <InfoBoard type="right" :show-info-board="infoBoard.gamePlay">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gamePlay = !infoBoard.gamePlay">{{
            infoBoard.gamePlay ? '关闭' : '查看游戏规则'
            }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">游戏规则</h1>
      </template>
      <template #content>
        <div>
          <p>职业自选 / 分支自选</p>
          <p>玩家每人领取一个号码作为自己标识： 1 2 3 4 5 6</p>
          <p>起始人物限定一身紫色品质护甲，属性不限，无模组（属性模组除外） 无星象碎片</p>
          <p>无法使用 ：1超能 2手雷 3充能近战 （*职业技能可用）</p>
          <p>武器为任意蓝色品质的装备，不限使用，可以随意更换</p>
          <p>赛季神器可以点亮第一排眩晕勇士的模组</p>
          <p>
            raid本中掉落的武器或护甲可以直接使用，掉落的武器与护甲，不能进行大师升级，但是可以插入模组（掉落的装备为
            Raid 装备，可以插 Raid 模组）
          </p>
          <p>武器可以增加任意模组，护甲可以增加属性模组</p>
          <hr />
          <p>在每次遭遇战（不包含开门关）开始之前</p>
          <p>所有玩家均可在卡池中抽取两张卡牌</p>
          <p>商店免费刷新次数+1</p>
          <p>每开启一个宝箱（含隐藏箱）获得 1-3 个货币，若无暇通过遭遇战额外奖励6单位货币</p>
          <p>
            无暇的判断条件为：插旗之后通关本次遭遇战无人死亡即可，若出现bug/掉线/没摸子弹等其他情况团灭不计在内，不可以主动进行团灭
          </p>
          <p>且遭遇战正在进行时，落地死亡的人不能获得无暇奖励</p>
          <hr />
          <p>减益卡牌说明</p>
          <p>每携带一张微弱不适卡牌，每过一关遭遇战则获得 1 货币</p>
          <p>每携带一张重度不适卡牌，每过一关遭遇战则获得 2 货币</p>
          <p>每携带一张反人类卡牌，每过一关遭遇战则获得 3 货币</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/options';
</style>
