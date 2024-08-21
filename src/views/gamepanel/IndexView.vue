<script lang="ts" setup>
import { useUserStore } from '@/stores'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { lightImg, cardImg, getSocket } from '@/utils'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'

// 用户信息
const { role, playerName, roomId } = storeToRefs(useUserStore())

// 网页加载
const webLoading = ref(false)
const setWebLoading = (status: boolean) => {
  webLoading.value = status
}

// 房间信息
const roomConfig: any = ref()

// 玩家信息
const playerConfig: any = ref()
const roleId = ref(0)

// 信息版配置
const infoBoard: any = ref({
  gameRoom: true,
  gameMap: false,
  gamePlay: true,
  gameChallenge: true,
  gameDeck: false,
  gameDeckList: false,
  gameBounty: false,
  gamePlayerEvent: false,
  gameGlobalEvent: false,
  gameShop: false
})

const route: any = ref('')
const router = useRouter()
const routePath = [
  '/room',
  '/map',
  '/options',
  '/deck',
  '/decklist',
  '/bounty',
  '/playerevent',
  '/globalevent',
  '/shop'
]

// socket
let socket: any

// 导航栏
const activeIndex = ref(0)
// 设置导航栏激活状态
const setActive = (index: number) => {
  activeIndex.value = index
}

// 玩家信息
const playerConfigStage = computed(() => {
  return (playerConfig.value?.playerStatus === undefined || playerConfig.value?.playerStatus === null) ? true : false
})

// 突袭信息
const raidConfig = computed(() => {
  if (playerConfigStage.value) {
    return false
  }

  return (roomConfig?.value?.raidConfig?.raidId !== undefined && roomConfig?.value?.raidConfig?.raidId !== null) ? true : false
})

// 名片
const emblem = computed(() => {

  if (playerName.value === '和泉纱雾') {
    return {
      special: new URL('/images/emblem/es-w.jpg', import.meta.url).href,
      icon: new URL('/images/emblem/es_icon.png', import.meta.url).href
    }
  } else if (playerName.value === '年糕明') {
    return {
      special: new URL('/images/emblem/up/ngm/special.jpg', import.meta.url).href,
      icon: new URL('/images/emblem/up/ngm/overlay.png', import.meta.url).href
    }
  } else if (playerName.value === '铸币梅eve') {
    return {
      special: new URL('/images/emblem/up/zbmeve/special.png', import.meta.url).href,
      icon: new URL('/images/emblem/up/zbmeve/overlay.png', import.meta.url).href
    }
  } else if (roleId.value !== 0 && playerConfig?.value?.isCaptain && raidConfig) {
    return {
      special: new URL('/images/emblem/captain-w.jpg', import.meta.url).href,
      icon: new URL('/images/emblem/captain_icon.png', import.meta.url).href
    }
  } else if (role.value === 'titan' || role.value === 'hunter' || role.value === 'warlock') {
    return {
      special: new URL('/images/emblem/' + role.value + '-w.jpg', import.meta.url).href,
      icon: new URL('/images/emblem/' + role.value + '_icon.png', import.meta.url).href
    }
  }
  else {
    return {
      special: new URL('/images/emblem/' + role.value + '-w.jpg', import.meta.url).href,
      icon: new URL('/images/emblem/' + role.value + '_icon.png', import.meta.url).href
    }
  }
})

// 特殊事件模态框
const specialDialogVisible = computed(() => {
  if (playerConfigStage.value) {
    return false
  }

  return (playerConfig?.value.specialConfig === '' && playerConfig?.value.specialConfig.eventType !== 'runPunish') ? false : true
})
const runSpecialByCard = (card: any) => {
  setWebLoading(true)
  const specialConfig = playerConfig?.value.specialConfig
  if (specialConfig.eventType === 'Tyrant') {
    specialConfig.to = card.roleId
  }
  if (specialConfig.eventType === 'Die-For-Money') {
    specialConfig['selectType'] = card.cardType
  }
  if (specialConfig.eventType === 'Bumper-Harvest' && playerConfig.value.roleId !== specialConfig.players[specialConfig.nowPlayer]) {
    ElMessage({
      message: '当前不是你的回合',
      type: 'error',
      grouping: true
    })
    setWebLoading(false)
    return
  }
  socket.emit('runSpecialByCard', {
    roomId: roomId.value,
    specialConfig: specialConfig,
    card: card
  })
}
const selectRoleId: any = ref(0)
const showPlayerOptions = computed(() => {
  return selectRoleId.value === 0 ? false : true
})
const setRoleId = (id: number) => {
  if (id === playerConfig.value.roleId && playerConfig?.value.specialConfig.eventType !== 'Transposition') {
    ElMessage({
      message: '你不能选择自己！',
      grouping: true,
      type: 'error'
    })
    return
  }

  if (playerConfig.value.specialConfig.eventType === 'Transposition') {
    if (selectRoleId.value == 0) {
      selectRoleId.value = []
    }

    if (selectRoleId.value.length < 2) {
      selectRoleId.value.push(id)
    }
    else {
      if (selectRoleId.value.includes(id)) {
        ElMessage({
          message: '这名玩家已被选择',
          grouping: true,
          type: 'error'
        })
      }
      else {
        selectRoleId.value.shift()
        selectRoleId.value.push(id)
      }
    }
  } else {
    selectRoleId.value = id
  }
}
const runSpecialEvent = (value: any) => {
  setWebLoading(true)
  const specialConfig = playerConfig?.value.specialConfig
  if (specialConfig.eventType === 'Alex-Mercer' || specialConfig.eventType === 'Personal' || specialConfig.eventType === 'This-Is-The-Deal' || specialConfig.eventType === 'In-The-Name-of-Preservation') {
    if (selectRoleId.value === 0) {
      ElMessage({
        message: "请选择一个玩家",
        type: 'error',
        grouping: true
      })
      setWebLoading(false)
      return
    }
    specialConfig['to'] = selectRoleId.value
  }
  if (specialConfig.eventType === 'Transposition') {
    if (selectRoleId.value.length < 2) {
      ElMessage({
        message: "请选择两个玩家",
        type: 'error',
        grouping: true
      })
      setWebLoading(false)
      return
    }
    specialConfig['send'] = selectRoleId.value[0]
    specialConfig['to'] = selectRoleId.value[1]
  }
  specialConfig['value'] = value
  socket.emit('runSpecialEvent', {
    roomId: roomId.value,
    specialConfig: specialConfig
  })
}

// 抽卡模态框
const deckDialogVisible = computed(() => {
  if (playerConfigStage.value) {
    return false
  }

  return playerConfig?.value.punishCount > 0 ? true : false
})

// 添加卡牌
const cardFlip = ref(Array.from({ length: 12 }, () => false))
const runPunish = (card: any, index: number) => {
  if (cardFlip.value[index]) {
    return
  }

  if (playerConfig.value.punishCount.value <= 0) {
    ElMessage({
      message: '抽卡次数已用完',
      grouping: true,
      type: 'error'
    })
    return
  }

  cardFlip.value[index] = true

  setWebLoading(true)
  socket.emit('runPunish', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    card: card
  })
}

// 初始化
const initGamePanel = () => {
  webLoading.value = false

  // 设置路由
  route.value = useRoute()
  for (let i = 0; i < routePath.length; i++) {
    const routePathStr = route.value.path
    if (routePathStr == routePath[i]) {
      activeIndex.value = i
    }
  }

  socket = getSocket()

  // 获取连接数
  // socket.off('connection_count')
  // socket.on('connection_count', (data: any) => {
  //   console.log(data)
  // })

  // 消息传递
  socket.off('message')
  socket.on('message', (data: any) => {
    if (data.message !== undefined && data.type !== 'runGlobalEvent' && data.type !== 'specialCard') {
      console.log(data)
      ElMessage({
        message: data.message,
        grouping: true,
        type: data.messageType !== undefined ? data.messageType : 'info'
      })
    }

    // 加入房间
    if (data.type === 'joinRoom') {
      roomId.value = data.roomId
      webLoading.value = true
      socket.emit('getUserInfo', {
        roomId: roomId.value,
        playerName: playerName.value
      })
    }

    // 选择位置和离开房间
    if (data.type === 'clickSeat' || data.type === 'leaveRoom') {
      webLoading.value = true
      socket.emit('getUserInfo', {
        roomId: roomId.value,
        playerName: playerName.value
      })
    }

    // 开始游戏
    if (data.type === 'startGame') {
      router.push('/map')
      activeIndex.value = 1
    }

    // 全局事件信息 / 特殊卡牌信息
    if (data.type === 'runGlobalEvent' || data.type === 'specialCard') {
      ElMessage({
        message: data.message,
        type: data.messageType,
        duration: 0,
        showClose: true
      })
    }

    // 设置房间信息
    let getRoomInfoStage = data.stage?.includes(2)
    if (getRoomInfoStage) {
      webLoading.value = true
      socket.emit('getRoomInfo', {
        roomId: roomId.value
      })
    }
    if (data.type === 'getRoomInfo') {
      roomId.value = data.roomInfo.roomId
      roomConfig.value = data.roomInfo
    }

    // 设置用户信息
    let getUserInfoStage = data.stage?.includes(1)
    if (getUserInfoStage) {
      webLoading.value = true
      socket.emit('getUserInfo', {
        roomId: roomId.value,
        playerName: playerName.value
      })
    }
    if (data.type === 'getUserInfo') {
      console.log('用户新数据', data.userInfo)
      playerConfig.value = data.userInfo
    }

    // 掀桌
    if (data.type === 'flipTheTable') {
      router.push('/home')
    }

    cardFlip.value = Array.from({ length: 12 }, () => false)
    webLoading.value = false
  })


  // 断开连接后操作
  socket.off('disconnect')
  socket.on('disconnect', () => {
    ElMessage({
      message: '与服务器通信失败，请稍后',
      grouping: true,
      type: 'error'
    })
    roomId.value = ''
    activeIndex.value = 0
    webLoading.value = false
    router.push('/room')
  })


  // 判断加入房间
  if (roomId.value !== '') {
    setWebLoading(true)
    socket.emit('joinRoom', {
      roomId: roomId.value,
      player: {
        role: role.value,
        roleId: roleId.value,
        playerName: playerName.value
      }
    })
  }
}

initGamePanel()

// // 关闭连接
// function disconnectSocket() {
//     if (socket) {
//         socket.disconnect()
//         socket = null
//     }
// }

// // 当用户离开页面调用
// window.addEventListener('beforeunload', disconnectSocket);

watch(
  () => [roomConfig.value, playerConfig.value, roomId.value],
  () => {
    if (roomId.value === '') {
      roleId.value = 0
    }
    else {
      if (roomConfig.value && playerConfig.value) {
        roleId.value = playerConfig.value.roleId
      }
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
);

</script>

<template>
  <div id="gamepanel" v-loading.fullscreen.lock="webLoading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <div class="header">
      <div class="image" :style="{ 'background-image': `url(${emblem.special})` }"></div>
      <div class="role">
        <div class="icon" :style="{ 'background-image': `url(${emblem.icon})` }"></div>
        <div class="info">
          <router-link class="emblem" to="home">
            <p class="name">{{ playerName }}</p>
            <div class="sub">
              <p class="number">{{ roleId }} 号玩家</p>
              <p class="line">/</p>
              <p class="light">2000</p>
              <p class="line">/</p>
              <p class="money">
                <img class="light" :src="lightImg" alt="light.png" />
                光尘货币：{{ playerConfig?.playerMoney === undefined ? 0 : playerConfig?.playerMoney }}
              </p>
              <p class="line">/</p>
              <p class="draw-count">
                <img class="draw" :src="cardImg" alt="card.png" />
                抽卡次数：{{ playerConfig?.drawCount === undefined ? 0 : playerConfig?.drawCount }}
              </p>
            </div>
          </router-link>
        </div>
      </div>

      <div class="menu">
        <ul>
          <li class="menu-link" key="0" :class="{ active: activeIndex === 0 }" @click="setActive(0)">
            <router-link to="room" target="windows">房间面板</router-link>
          </li>
          <li v-if="playerConfig?.isCaptain && roomConfig?.roomStatus === 'playing'" class="menu-link" key="1"
            :class="{ active: activeIndex === 1 }" @click="setActive(1)">
            <router-link to="map" target="windows">地图</router-link>
          </li>
          <li v-if="raidConfig" class="menu-link" key="2" :class="{ active: activeIndex === 2 }" @click="setActive(2)">
            <router-link to="options" target="windows">操作面板</router-link>
          </li>
          <li v-if="raidConfig" class="menu-link" key="3" :class="{ active: activeIndex === 3 }" @click="setActive(3)">
            <router-link to="deck" target="windows">卡牌抽取</router-link>
          </li>
          <li v-if="raidConfig" class="menu-link" key="4" :class="{ active: activeIndex === 4 }" @click="setActive(4)">
            <router-link to="decklist" target="windows">持有卡牌</router-link>
          </li>
          <li v-if="raidConfig" class="menu-link" key="5" :class="{ active: activeIndex === 5 }" @click="setActive(5)">
            <router-link to="bounty" target="windows">悬赏任务</router-link>
          </li>
          <li v-if="raidConfig" class="menu-link" key="6" :class="{ active: activeIndex === 6 }" @click="setActive(6)">
            <router-link to="playerevent" target="windows">个人事件</router-link>
          </li>
          <li v-if="raidConfig" class="menu-link" key="7" :class="{ active: activeIndex === 7 }" @click="setActive(7)">
            <router-link to="globalevent" target="windows">全局事件</router-link>
          </li>
          <li v-if="raidConfig" class="menu-link" key="8" :class="{ active: activeIndex === 8 }" @click="setActive(8)">
            <router-link to="shop" target="windows">商店</router-link>
          </li>
          <!-- <li class="menu-link" key="9" :class="{ active: activeIndex === 9 }" @click="setActive(9)">
            <router-link to="shop" target="windows">记忆水晶</router-link>
          </li> -->
        </ul>
      </div>
    </div>

    <div class="main">
      <router-view :roomConfig="roomConfig" :playerConfig="playerConfig" :webLoading="webLoading"
        :setWebLoading="setWebLoading" :infoBoard="infoBoard"></router-view>
    </div>

    <!-- 特殊事件模态框 -->
    <el-dialog class="dialog special-dialog" v-model="specialDialogVisible" :close-on-click-modal="false"
      :close-on-press-escape="false" width=" 75rem" align-center>
      <div class="box">
        <div class="title-box">
          <h1 class="title">{{ playerConfig?.specialConfig.title }}</h1>
          <p class="sub-title">{{ playerConfig?.specialConfig.description }}</p>
          <p class="tips" v-if="showPlayerOptions">你选择了 {{ selectRoleId }} 号玩家</p>
        </div>
        <div class="deck-list-box"
          v-if="playerConfig?.specialConfig.type === 'cardList' && playerConfig?.specialConfig.eventType !== 'Take-Others'">
          <div class="item card-item" v-for="(card, index2) in playerConfig?.specialConfig.deckList" :key="index2"
            :class="{
              'card-item-1': card.cardType === 'MicroGain' || card.cardType === 'StrongGain',
              'card-item-2':
                (card.cardType === 'MicroDiscomfort' || card.cardType === 'StrongDiscomfort') && playerConfig?.specialConfig.eventType !== 'Take-Others',
              'card-item-3': (card.cardType === 'Opportunity' || card.cardType === 'Unacceptable') && playerConfig?.specialConfig.eventType !== 'Take-Others',
              'card-item-4': card.cardType === 'Technology' && playerConfig?.specialConfig.eventType !== 'Take-Others',
              'card-item-5': card.cardType === 'Support' && playerConfig?.specialConfig.eventType !== 'Take-Others'
            }">
            <div class="card" @click="runSpecialByCard(card)">
              <div class="info card-info">
                <p class="card-name">{{ card.cardCnName
                  }}</p>
                <p class="card-sub">{{ card.cardName }}
                </p>
                <p class="card-role-id" v-if="card.roleId">{{ card.roleId }} 号玩家</p>
              </div>
            </div>
          </div>
        </div>
        <div class="deck-list-box" v-if="playerConfig?.specialConfig.eventType === 'Take-Others'">
          <div class="item card-item card-item-1" v-for="(card, index2) in playerConfig?.specialConfig.deckList"
            :key="index2">
            <div class="card" @click="runSpecialByCard(card)">
              <div class="info card-info">
                <p class="card-role-id" v-if="card.roleId">{{ card.roleId }} 号玩家</p>
              </div>
            </div>
          </div>
        </div>
        <div class="player-list-box" v-if="playerConfig?.specialConfig.type === 'playerList'">
          <div class="player-box" v-for="player in playerConfig?.specialConfig.playerList" :key="player">
            <div class="player-info" v-if="player !== null" @click="setRoleId(player.roleId)" :style="{
              'background-image': `url('/images/emblem/${player === undefined ? ' ' : player.role}.jpg')`,
            }">
              <p class="role-id">号码：{{ player.roleId }}</p>
              <p class="player-name">玩家: {{ player.playerName }}</p>
              <p class="player-role">角色: {{ player.role }}</p>
            </div>
          </div>
          <div class="player-options">
            <button type="button" class="button" v-for="option in playerConfig?.specialConfig.optionsList" :key="option"
              @click=runSpecialEvent(option.value)>
              {{ option.text }}
            </button>
          </div>
        </div>
        <div class="options-list-box" v-if="playerConfig?.specialConfig.type === 'optionsList'">
          <button type="button" class="button" v-for="option in playerConfig?.specialConfig.optionsList" :key="option"
            @click=runSpecialEvent(option.value)>
            {{ option.text }}
          </button>
        </div>
      </div>
    </el-dialog>

    <!-- 卡牌抽奖模态框 -->
    <el-dialog class="dialog deck-dialog" v-model="deckDialogVisible" :close-on-click-modal="false" width="79.25rem"
      align-center>
      <div class="deck-list-info">
        <h1 class="deck-list-title">放弃事件惩罚：抽取1次特殊卡牌</h1>
      </div>

      <div class="deck-list-box">
        <div class="card-item" v-for="(card, index) in playerConfig?.specialConfig.tList" :key="index" :class="{
          flip: cardFlip[index],
          'card-item-4': true
        }" @click="runPunish(card, index)">
          <div class="card card-front">
            <div class="card-info">
              <p class="card-id">{{ card.cardCnName }}</p>
              <p class="card-name">{{ card.cardName }}</p>
            </div>
          </div>
          <div class="card card-back"></div>
        </div>
      </div>
      <!-- <button type="button" class="button deck-confirm" @click="deckDialogVisible = false">
        确认
      </button> -->
    </el-dialog>
  </div>
</template>

<style lang="scss">
@import '@/assets/styles/gamepanel';
</style>
