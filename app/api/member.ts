import type { ApiResponse } from '~/types/api';

const BASE = '/api/v1/members/me';

export interface MemberProfile {
  id: number;
  provider: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useMemberApi() {
  const { $api } = useNuxtApp();

  return {
    async profile() {
      const { data } = await $api.get<ApiResponse<MemberProfile>>(BASE);
      return data.data;
    },

    async updateName(name: string) {
      const { data } = await $api.patch<ApiResponse<MemberProfile>>(BASE, { name });
      return data.data;
    },

    async withdraw() {
      await $api.delete(BASE, { skipAuthRefresh: true });
    },
  };
}
