<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getSocket,
  shuffle
} from '@/utils'
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

// 判断数据是否已收到
// 房间信息阶段
// const roomConfigStage = computed(() => {
//   return (props.roomConfig?.raidConfig === undefined || props.roomConfig?.raidConfig === null) ? true : false
// })
// 玩家信息
const playerConfigStage = computed(() => {
  return (props.playerConfig?.playerStatus === undefined || props.playerConfig?.playerStatus === null) ? true : false
})

// socket
let socket: any

// 卡池信息框
const deckInfoDialogVisible = ref(false)

// 卡组类型表
const deckType = [
  'MicroGain',
  'StrongGain',
  'Opportunity',
  'MicroDiscomfort',
  'StrongDiscomfort',
  'Unacceptable',
  'Technology',
  'Support'
]
// 卡牌抽取框
const deck: any = ref([])
const deckDialogVisible = computed(() => {
  if (playerConfigStage.value) {
    return false
  }
  return playerConfig.value.playerStatus === 'draw'
})
const deckDialogConfig: any = ref({
  deckListStyle: Array.from({ length: 5 }, () => false),
  flips: Array.from({ length: 12 }, () => false),
  deckListName: '',
  canClick: false,
  microGainCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[0] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  }),
  strongGainCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[1] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  }),
  opportunityCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[2] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  }),
  microDiscomfortCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[3] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  }),
  strongDiscomfortCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[4] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  }),
  unacceptableCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[5] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  }),
  technologyCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[6] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  }),
  supportCount: computed(() => {
    let count = 0
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardType === deckType[7] && !deckDialogConfig.value.flips[i]) {
        count += 1
      }
    }
    return count
  })
})

// 卡池点击事件
const showDeckList = (type: string) => {
  deckDialogConfig.value.flips = Array.from({ length: 12 }, () => false)
  playerConfig.value.drawCardType = type
  setWebLoading(true)
  socket.emit('showDeckList', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    listType: playerConfig.value.drawCardType
  })
}

// 卡池关闭事件
const closeDeck = () => {
  setWebLoading(true)
  socket.emit('closeDeckList', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName
  })
  const reloadStyle = setTimeout(() => {
    deckDialogConfig.value.deckListStyle = Array.from({ length: 5 }, () => false)
    deckDialogConfig.value.flips = Array.from({ length: 12 }, () => false)
    clearTimeout(reloadStyle)
  }, 300)
}

// 卡牌点击事件
const clickCard = (card: any, index: any) => {
  if (!deckDialogConfig.value.canClick) {
    ElMessage({
      message: '当前不能点击！！',
      type: 'error',
      grouping: true
    })
    return
  }
  // 判断卡牌是否被抽取过
  if (!deckDialogConfig.value.flips[index] && deckDialogConfig.value.canClick) {
    setWebLoading(true)
    socket.emit('clickCard', {
      roomId: roomConfig.value.roomId,
      playerName: playerConfig.value.playerName,
      card: card
    })
  }
}

// 初始化
const initDeck = () => {
  socket = getSocket()

  socket.off('showDeckList')
  socket.on('showDeckList', (data: any) => {
    if (data.type === 'success') {
      // 打开模态框
      deckDialogConfig.value.deckListName = data.deckListName
      deck.value = data.deckList
    }

    // 观星
    if (playerConfig.value?.playerAttributes.stargazing) {
      deckDialogConfig.value.flips = Array.from({ length: 12 }, () => true)

      const changeCardState = setTimeout(() => {
        deckDialogConfig.value.flips = Array.from({ length: 12 }, () => false)
        clearTimeout(changeCardState)
      }, 5000)

      const shuffleDeckList = setTimeout(() => {
        deck.value = shuffle(deck.value)
        deckDialogConfig.value.canClick = true
        clearTimeout(shuffleDeckList)
      }, 5500)
    } else {
      deckDialogConfig.value.canClick = true
    }

    ElMessage({
      message: data.message,
      type: data.messageType,
      grouping: true
    })
    setWebLoading(false)
  })

  if (deckDialogVisible.value && playerConfig.value.drawCardType !== '') {
    setWebLoading(true)
    socket.emit('showDeckList', {
      roomId: roomConfig.value.roomId,
      playerName: playerConfig.value.playerName,
      listType: playerConfig.value.drawCardType
    })
  }

  socket.off('cardClick')
  socket.on('cardClick', (data: any) => {
    for (let i = 0; i < deck.value.length; i++) {
      if (deck.value[i].cardName === data.card.cardName) {
        deckDialogConfig.value.flips[i] = true
      }
    }

    setWebLoading(false)
  })

  // 戒赌
  if (playerConfig.value?.playerAttributes.deckClosed) {
    ElMessage({
      message: '您的抽卡系统已被关闭！请前往商店进行清除卡片',
      type: 'error',
      grouping: true,
      showClose: true,
      duration: 0
    })
  }

  // 赌徒
  if (playerConfig.value?.playerAttributes.gambler) {
    ElMessage({
      message: '你是赌徒，只能抽取对赌博弈卡池',
      type: 'warning',
      grouping: true,
      showClose: true,
      duration: 0
    })
  }

  // 观星
  if (playerConfig.value?.playerAttributes.stargazing) {
    ElMessage({
      message: '观星效果已启用，每次开启卡池时你有 5 秒的时间观看卡池内容',
      type: 'warning',
      grouping: true,
      showClose: true,
      duration: 0
    })
  }

  // 十三幺
  if (playerConfig.value?.playerAttributes.thirteen) {
    ElMessage({
      message: '你身上携带了 十三幺，卡牌不消除，则无法抽取卡牌',
      type: 'error',
      grouping: true,
      showClose: true,
      duration: 0
    })
  }

  // 开摆
  if (playerConfig.value?.giveUp) {
    ElMessage({
      message: '你身上有开摆事件，暂不为你开放抽卡',
      type: 'error',
      grouping: true,
      showClose: true,
      duration: 0
    })
  }
}

const isInitialized = ref(false);
const isLoading = ref(true)
watch(
  () => [props.roomConfig, props.playerConfig],
  () => {
    if (props.roomConfig !== undefined && props.playerConfig !== undefined) {
      isLoading.value = false
      if (!isInitialized.value) {
        initDeck()
        isInitialized.value = true
      }
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
);
</script>

<template>
  <div id="deck" v-loading.fullscreen.lock="isLoading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <h1 class="deck-title">您有 {{ playerConfig?.drawCount }} 次抽取卡牌的机会</h1>

    <!-- 卡牌抽奖框 -->
    <div class="deck-list">
      <div class="deck card-item-1" v-show="!playerConfig?.playerAttributes.gambler">
        <div class="deck-1 card" id="safe" @click="showDeckList('safe')"></div>
        <p class="deck-name">- 稳妥起见 -</p>
      </div>
      <div class="deck card-item-2" v-show="!playerConfig?.playerAttributes.gambler">
        <div class="deck-2 card" id="danger" @click="showDeckList('danger')"></div>
        <p class="deck-name">- 险中求胜 -</p>
      </div>
      <div class="deck card-item-3">
        <div class="deck-3 card" id="gambit" @click="showDeckList('gambit')"></div>
        <p class="deck-name">- 对赌博弈 -</p>
      </div>
      <div class="deck card-item-4" v-show="!playerConfig?.playerAttributes.gambler">
        <div class="deck-4 card" id="luck" @click="showDeckList('luck')"></div>
        <p class="deck-name">- 时来运转 -</p>
      </div>
      <div class="deck card-item-5" v-show="!playerConfig?.playerAttributes.gambler">
        <div class="deck-5 card" id="devote" @click="showDeckList('devote')"></div>
        <p class="deck-name">- 身心奉献 -</p>
      </div>
    </div>

    <!-- 卡牌数量数量显示 -->
    <p class="deck-count">
      当前卡池数量：
      微弱增益：{{ playerConfig?.playerAttributes.lastCount.MicroGain }} 张 |
      强大增益：{{ playerConfig?.playerAttributes.lastCount.StrongGain }} 张 |
      欧皇卡牌：{{ playerConfig?.playerAttributes.lastCount.Opportunity }} 张 |
      微弱不适：{{ playerConfig?.playerAttributes.lastCount.MicroDiscomfort }} 张 |
      重度不适：{{ playerConfig?.playerAttributes.lastCount.StrongDiscomfort }}张 |
      反人类：{{ playerConfig?.playerAttributes.lastCount.Unacceptable }} 张 |
      特殊卡牌：{{ playerConfig?.playerAttributes.lastCount.Technology }} 张 |
      辅助卡牌：{{ playerConfig?.playerAttributes.lastCount.Support }} 张
    </p>

    <!-- 卡池信息显示按钮 -->
    <button class="button deck-info" @click="deckInfoDialogVisible = true">卡池信息</button>

    <!-- 卡池信息框 -->
    <el-dialog class="dialog deck-info-dialog" v-model="deckInfoDialogVisible" :close-on-click-modal="false"
      align-center>
      <div class="deck-list-info">
        <h1>卡池信息</h1>
        <p class="deck-type-info safe">
          卡池1 - 稳妥起见 - (6张微弱增益 1张强大增益 4张微弱不适 1张特殊卡牌)
        </p>
        <p class="deck-type-info danger">
          卡池2 - 险中求胜 - (4张微弱增益 2张强大增益 1张欧皇增益 2张微弱不适 2张重度不适
          1张特殊卡牌)
        </p>
        <p class="deck-type-info gambit">
          卡池3 - 对赌博弈 - (5张强大增益 1张欧皇增益 5张重度不适 1张反人类)
        </p>
        <p class="deck-type-info luck">
          卡池4 - 时来运转 - (1张强大增益 1张欧皇增益 1张重度不适 1张反人类 8张特殊卡牌)
        </p>
        <p class="deck-type-info devote">
          卡池5 - 身心奉献 - (8张辅助卡牌 4张微弱不适) (辅助卡牌数量不够则会换成特殊卡牌)
        </p>
        <p class="deck-type-info">
          --------------------------------------------------------------------------------------------------------
        </p>
        <p class="deck-type-info">
          如果想当平民安逸的度过则可以抽取 稳妥起见，如果想体验刺激的则可以抽取 险中求胜
        </p>
        <p class="deck-type-info">
          如果想当赌狗玩更刺激的则可以抽取 对赌博弈，如果想逆转命运的则可以抽取 时来运转
        </p>
        <p class="deck-type-info">如果想为团队当工具人的则可以抽取 身心奉献</p>
      </div>
      <div class="deck-confirm-box">
        <button type="button" class="button deck-cancel" @click="deckInfoDialogVisible = false">
          关闭
        </button>
      </div>
    </el-dialog>

    <!-- 卡牌抽奖模态框 -->
    <el-dialog class="dialog deck-dialog" v-model="deckDialogVisible" :close-on-click-modal="false"
      :close-on-press-escape="false" width="79.25rem" align-center>
      <div class="deck-list-info">
        <p class="deck-list-name">
          {{ deckDialogConfig.deckListName }}
        </p>
        <p class="deck-list-draw">您有 {{ playerConfig?.drawCount }} 次抽取卡牌的机会</p>
        <p class="deck-list-count">
          当前卡池状态：
          <span v-if="deckDialogConfig.microGainCount !== 0">
            | 微弱增益：{{ deckDialogConfig.microGainCount }} 张 |
          </span>
          <span v-if="deckDialogConfig.strongGainCount !== 0">
            | 强大增益：{{ deckDialogConfig.strongGainCount }} 张 |
          </span>
          <span v-if="deckDialogConfig.opportunityCount !== 0">
            | 欧皇增益：{{ deckDialogConfig.opportunityCount }} 张 |
          </span>
          <span v-if="deckDialogConfig.microDiscomfortCount !== 0">
            | 微弱不适：{{ deckDialogConfig.microDiscomfortCount }} 张 |
          </span>
          <span v-if="deckDialogConfig.strongDiscomfortCount !== 0">
            | 重度不适：{{ deckDialogConfig.strongDiscomfortCount }} 张 |
          </span>
          <span v-if="deckDialogConfig.unacceptableCount !== 0">
            | 反人类：{{ deckDialogConfig.unacceptableCount }} 张 |
          </span>
          <span v-if="deckDialogConfig.technologyCount !== 0">
            | 特殊卡牌：{{ deckDialogConfig.technologyCount }} 张 |
          </span>
          <span v-if="deckDialogConfig.supportCount !== 0">
            | 辅助卡牌：{{ deckDialogConfig.supportCount }} 张 |
          </span>
        </p>
      </div>
      <div class="deck-list-box">
        <div class="card-item" :class="{
          flip: deckDialogConfig.flips[index],
          'card-item-1': deckDialogConfig.deckListName === '稳妥起见',
          'card-item-2': deckDialogConfig.deckListName === '险中求胜',
          'card-item-3': deckDialogConfig.deckListName === '对赌博弈',
          'card-item-4': deckDialogConfig.deckListName === '时来运转',
          'card-item-5': deckDialogConfig.deckListName === '身心奉献'
        }" v-for="(card, index) in deck" :key="index" @click="clickCard(card, index)">
          <div class="card card-front">
            <div class="card-info">
              <p class="card-id">{{ card.cardCnName }}</p>
              <p class="card-name">{{ card.cardName }}</p>
            </div>
          </div>
          <div class="card card-back"></div>
        </div>
      </div>
      <div class="deck-confirm-box">
        <button type="button" class="button deck-cancel" @click="closeDeck">关闭</button>
      </div>
    </el-dialog>

    <!-- 卡池关闭 -->
    <div class="deck-closed"
      v-if="playerConfig?.playerAttributes.deckClosed || playerConfig?.playerAttributes.thirteen || playerConfig?.giveUp">
    </div>

    <!-- 卡池信息版 -->
    <InfoBoard type="right" :show-info-board="infoBoard.gameDeck">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gameDeck = !infoBoard.gameDeck">{{
            infoBoard.gameDeck ? '关闭' : '查看卡池说明'
            }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">卡池说明</h1>
      </template>
      <template #content>
        <div>
          <p>每个卡池均有12张牌，每个人的卡池互不干涉</p>
          <p>卡牌分为正面和负面以及特殊卡牌</p>
          <p>正面分为微弱增益和强大增益和欧皇增益</p>
          <p>负面分为微弱不适和重度不适和反人类</p>
          <p>特殊分为特殊卡牌和辅助卡牌</p>
          <hr />
          <p>正面/负面卡牌删除后不会返回原卡池</p>
          <p>稳妥起见若凑不出等量类型的卡牌则无法抽取该卡池</p>
          <p>险中求胜欧皇增益抽完则换成强大增益</p>
          <p>对赌博弈欧皇增益抽完则换成强大增益，反人类抽完则换成重度不适</p>
          <p>
            时来运转欧皇增益抽完则换成强大增益，反人类抽完则换成重度不适，特殊卡牌抽完则不能继续抽取该卡池
          </p>
          <p>身心奉献辅助卡牌数量不够则换成微弱增益</p>
          <p>卡牌数量不足以填满卡池时，会随机把剩余在卡池中未抽出的卡牌塞入卡池中</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/deck';
</style>
