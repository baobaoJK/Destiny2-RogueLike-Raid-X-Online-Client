<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { lightImg, getSocket } from '@/utils'
import TipsView from '@/components/tips/IndexView.vue'
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

// socket
let socket: any

// 背包下标
const backpackIndex = ref(0)

// 圣水提示框
const waterDialogVisible = ref(false)
const waterDeckList: any = ref([])

// 提示框
const tipsRef = ref()
const tooltipShow = ref(false)
const tooltipConfig = ref({
  itemCnName: '',
  itemKind: '',
  itemRarity: '',
  itemDescription: '',
  sellMoney: '',
  itemCount: 0,
  tipType: ''
})

// 显示提示框
const showTooltip = (item: any, tipType: string) => {
  tooltipShow.value = true

  if (tipType === 'deleteCard') {
    tooltipConfig.value.itemCnName = item.cardCnName
    tooltipConfig.value.itemKind = '卡牌'
    tooltipConfig.value.itemRarity = '微弱不适'
    tooltipConfig.value.itemDescription = item.cardDescription
  }
  else {
    tooltipConfig.value.itemCnName = item.cnName
    tooltipConfig.value.itemKind = item.kind
    tooltipConfig.value.itemRarity = item.rarity
    tooltipConfig.value.itemDescription = item.description
    tooltipConfig.value.sellMoney = playerConfig.value.zeroBuy > 0 ? 0 : item.sell
    tooltipConfig.value.itemCount = item.count
    tooltipConfig.value.tipType = tipType

    if (playerConfig.value.playerAttributes.profiteer) {
      tooltipConfig.value.sellMoney = item.sell + 1
    }
  }

  tipsRef.value.setToolTips(item)
}
//  关闭提示框
const hideTooltip = () => {
  tooltipShow.value = false
}

// 获取物品图片
const getItemImg = (item: any) => {
  if (item.typeName === 'Weapons') {
    return `/images/shop/exotic/weapons/${item.cnName}.jpg`
  }

  if (item.typeName === 'Armor') {
    return `/images/shop/exotic/${item.role}/${item.itemName}.jpg`
  }

  if (item.typeName === 'water' || item.typeName === 'drawCount') {
    return `/images/shop/${item.itemName}.jpg`
  }

  if (item.typeName === 'weapon') {
    return `/images/shop/weapons/${item.itemName}.jpg`
  }

  return null
}

// 购买物品
const buyItem = (typeList: string, index: number) => {
  setWebLoading(true)
  socket.emit('buyItem', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    typeList: typeList,
    itemIndex: index
  })
}

// 使用圣水
const useItem = (index: number) => {
  setWebLoading(true)
  socket.emit('useItem', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    backpackIndex: index
  })
  backpackIndex.value = index
}

// 删除卡牌
const deleteCardItem = (card: any, index: number) => {
  setWebLoading(true)
  socket.emit('deleteCardItem', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    cardType: card.cardType,
    cardIndex: index,
    backpackIndex: backpackIndex.value
  })
}

// 刷新商店按钮
const refreshShop = () => {
  setWebLoading(true)
  socket.emit('refreshShop', {
    roomId: roomConfig.value.roomId
  })
}

// 开启商店
const openShop = () => {
  setWebLoading(true)
  socket.emit('openShop', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName
  })
}

// 商店初始化
const initShop = () => {
  socket = getSocket()

  socket.off('showWaterDeckList')
  socket.on('showWaterDeckList', (data: any) => {
    waterDeckList.value = data.deckList
    waterDialogVisible.value = true
    setWebLoading(false)
  })

  socket.off('hideWaterDeckList')
  socket.on('hideWaterDeckList', () => {
    waterDialogVisible.value = false
    setWebLoading(false)
  })

  // 静水监狱
  if (playerConfig?.value.playerAttributes.shopClosed) {
    ElMessage({
      message: '您的商店系统已被关闭！',
      type: 'error',
      grouping: true,
      duration: 0,
      showClose: true
    })
  }

  // 价格检测
  if (playerConfig?.value.playerAttributes.profiteer) {
    ElMessage({
      message: '购买任意物品价格提高 1 货币！',
      type: 'warning',
      grouping: true,
      duration: 0,
      showClose: true
    })
  }

  // 恶魔契约检测
  if (playerConfig?.value.devilspact != 0) {
    ElMessage({
      message: '恶魔契约已启用',
      type: 'warning',
      grouping: true,
      duration: 0,
      showClose: true
    })
  }

  // 未来市场
  if (playerConfig?.value.playerAttributes.market) {
    ElMessage({
      message: '未来市场已启用',
      type: 'warning',
      grouping: true,
      duration: 0,
      showClose: true
    })
  }

  // 开摆
  if (playerConfig?.value.giveUp) {
    ElMessage({
      message: '你身上有开摆事件，暂不为你开放商店',
      type: 'error',
      grouping: true,
      duration: 0,
      showClose: true
    })
  }
}

// 初始化
const isInitialized = ref(false);
const isLoading = ref(true)
watch(
  () => [props.roomConfig, props.playerConfig],
  () => {
    if (props.roomConfig !== undefined && props.playerConfig !== undefined) {
      isLoading.value = false
      if (!isInitialized.value) {
        initShop()
        isInitialized.value = true
        console.log(roomConfig.value)
      }
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
);
</script>

<template>
  <div id="shop" v-loading.fullscreen.lock="isLoading" element-loading-background="rgba(0, 0, 0, 0.8)"
    @mousemove="tipsRef?.moveTooltip($event)">
    <!-- 提示框 -->
    <TipsView ref="tipsRef" :tooltipShow="tooltipShow">
      <template #header>
        <div class="name">{{ tooltipConfig.itemCnName }}</div>
        <div class="type">
          <div class="kind">{{ tooltipConfig.itemKind }}</div>
          <div class="rarity">{{ tooltipConfig.itemRarity }}</div>
        </div>
      </template>
      <template #main>
        <div class="description">
          <div class="text">
            <p class="type">{{ tooltipConfig.itemDescription }}</p>
          </div>
          <hr>
          <div class="text">
            <p>库存: {{ tooltipConfig.itemCount }} 件</p>
          </div>
        </div>
        <div class="line"></div>
        <div class="monetary" v-if="tooltipConfig.tipType !== 'backpack'">
          <div class="name">
            <img class="light" :src="lightImg" alt="light.png" />
            <p>光尘货币</p>
          </div>
          <div class="info">
            <p class="text">
              <span class="money">{{ playerConfig?.playerMoney }}</span> /
              <span class="sell">{{ tooltipConfig.sellMoney }}</span>
            </p>
          </div>
        </div>
      </template>
    </TipsView>

    <div class="shop-list">
      <div class="shop-top">
        <h1 class="shop-title">随机商店</h1>
        <div class="shop-options">
          <button class="button refresh-button" @click="refreshShop" v-if="playerConfig?.isCaptain">刷新商店</button>
          <p id="refresh-count">免费刷新次数：{{ roomConfig?.shopConfig.refreshCount }}</p>
          <p id="pay-count">付费刷新费用(每人需支付)：{{ roomConfig?.shopConfig.refreshMoney / 6 }}</p>
        </div>
        <hr class="shop-line" />
      </div>

      <div class="shop-main">
        <!-- 售卖栏 -->
        <div class="shop-sell-list">
          <div class="item-list" v-if="roomConfig?.shopConfig.itemList.length === 0">
            <h2 class="shop-title">物品栏</h2>
            <hr class="shop-line" />
            <div class="item-list">
              <h1 class="tips">东西已经被买完啦</h1>
            </div>
          </div>
          <div class="item-list" v-else>
            <h2 class="shop-title">物品栏</h2>
            <hr class="shop-line" />
            <div class="item-list">
              <div v-for="(item, index) in roomConfig?.shopConfig.itemList" :key="item" class="item"
                @mousemove="showTooltip(item, 'item')" @mouseout="hideTooltip()" @click="buyItem('itemList', index)"
                :style="{ 'background-image': `url('/images/shop/${item.itemName}.jpg')` }"></div>
            </div>
          </div>

          <div class="weapon-list" v-if="roomConfig?.shopConfig.weaponList.length === 0">
            <h2 class="shop-title">武器栏</h2>
            <hr class="shop-line" />
            <div class="item-list">
              <h1 class="tips">东西已经被买完啦</h1>
            </div>
          </div>
          <div class="weapon-list" v-else>
            <h2 class="shop-title">武器栏</h2>
            <hr class="shop-line" />
            <div class="item-list">
              <div v-for="(item, index) in roomConfig?.shopConfig.weaponList" :key="item" class="item"
                @mousemove="showTooltip(item, 'item')" @mouseout="hideTooltip()" @click="buyItem('weaponList', index)"
                :style="{ 'background-image': `url('/images/shop/weapons/${item.itemName}.jpg')` }"></div>
            </div>
          </div>


          <div class="exotic-list" v-if="roomConfig?.shopConfig.exoticList.length === 0">
            <h2 class="shop-title">异域装备栏</h2>
            <hr class="shop-line" />
            <div class="item-list">
              <h1 class="tips">东西已经被买完啦</h1>
            </div>
          </div>
          <div class="exotic-list" v-else>
            <h2 class="shop-title">异域装备栏</h2>
            <hr class="shop-line" />
            <div class="item-list">
              <div v-for="(item, index) in roomConfig?.shopConfig.exoticList" :key="item" class="item"
                @mousemove="showTooltip(item, 'item')" @mouseout="hideTooltip()" @click="buyItem('exoticList', index)"
                :style="{
                  'background-image': `url('${getItemImg(item)}')`
                }"></div>
            </div>
          </div>
        </div>

        <!-- 背包 -->
        <div class="backpack">
          <h1 class="backpack-title">背包</h1>
          <hr class="backpack-line" />
          <div class="item-list" v-if="playerConfig?.backpack.length === 0">
            <h1>当前背包无物品</h1>
          </div>
          <div class="item-list" v-else>
            <div v-for="(item, index) in playerConfig?.backpack" :key="index" class="item"
              @mousemove="showTooltip(item, 'backpack')" @mouseout="hideTooltip()" @click="useItem(index)"
              :style="{ 'background-image': `url('${getItemImg(item)}')` }"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- 圣水提示框 -->
    <el-dialog class="card-dialog" v-model="waterDialogVisible" :close-on-click-modal="false" width="79.25rem"
      align-center>
      <h1 class="title">选择要删除的卡牌</h1>
      <div class="card-list-box">
        <div class="card-item" v-for="(card, index) in waterDeckList" :key="index"
          @mousemove="showTooltip(card, 'deleteCard')" @mouseout="hideTooltip()" @click="deleteCardItem(card, index)"
          :class="{
            'card-item-2': card.cardType === 'MicroDiscomfort' || card.cardType === 'StrongDiscomfort',
            'card-item-3': card.cardType === 'Unacceptable',
            'card-item-4': card.cardType === 'Technology'
          }">
          <div class="card">
            <div class="card-info">
              <p class="card-id">{{ card.cardCnName }}</p>
              <p class="card-name">{{ card.cardName }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="card-confirm-box">
        <button type="button" class="button card-cancel" @click="waterDialogVisible = false">
          取消
        </button>
      </div>
    </el-dialog>

    <!-- 商店关闭模态框 -->
    <div class="shop-closed" v-if="playerConfig?.playerAttributes.shopClosed || playerConfig?.giveUp">
      <button class="button open-shop" v-if="playerConfig?.playerAttributes.shopClosed" @click="openShop">
        开启商店
      </button>
    </div>

    <!-- 商店信息版 -->
    <InfoBoard type="right" :show-info-board="infoBoard.gameShop">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gameShop = !infoBoard.gameShop">{{
            infoBoard.gameShop ? '关闭' : '查看商店说明'
            }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">商店说明</h1>
      </template>
      <template #content>
        <div>
          <p>随机售卖栏不会自己刷新，每轮遭遇战可获得一次免费随机售卖栏刷新机会，不可叠加</p>
          <p>
            免费刷新使用后可使用货币付费刷新，第一次刷新消耗1单位货币，第二次刷新消耗2单位货币，以此类推，付费刷新消耗不重置
          </p>
          <p>商店除遭遇战进行中都可以使用，打遭遇战团灭了之后到下一次开打前也可以使用</p>
          <hr />
          <p>固定售卖</p>
          <p>1阶圣水，可消除一张微弱不适卡牌，售价3单位货币</p>
          <p>2阶圣水，可消除一张重度不适卡牌，售价6单位货币</p>
          <p>3阶圣水，可消除一张反人类卡牌，售价12单位货币</p>
          <p>7阶圣水，可消除一张特殊卡牌，售价7单位货币</p>
          <p>卡牌抽取机会一次，售价3单位货币</p>
          <hr />
          <p>随机售卖</p>
          <p>
            随机售卖栏1：【白弹】自动步枪、斥候、脉冲、手炮、微冲、手枪、弓箭自选（售价1单位货币）
          </p>
          <p>随机售卖栏2：【绿弹】霰弹、榴弹、聚合、狙击、追踪、偃月自选（售价3单位货币）</p>
          <p>随机售卖栏3：【重弹】刀剑、榴弹、筒子、线融、机枪自选（售价6单位货币）</p>
          <p>随机售卖栏4：异域武器（售价6单位货币）</p>
          <p>随机售卖栏5：异域护甲（售价6单位货币）</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>

<style lang="scss">
@import '@/assets/styles/shop';
</style>
