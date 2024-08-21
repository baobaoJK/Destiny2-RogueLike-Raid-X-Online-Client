import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    // 房间id
    const roomId = ref('')
    // 角色
    const role = ref('')
    // 角色 ID
    const roleId = ref(0)
    // 用户名
    const playerName = ref('')

    //  设置用户信息
    const setUserInfo = async (newUserInfo: any) => {
      role.value = newUserInfo.role
      playerName.value = newUserInfo.playerName
      roomId.value = ''
    }

    return {
      roomId,
      role,
      roleId,
      playerName,
      setUserInfo
    }
  },
  {
    persist: true
  }
)
