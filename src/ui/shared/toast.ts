import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';

type ToastState = {
  message: string | null;
  /** 같은 메시지가 반복돼도 Host의 effect가 재발동되도록 단조 증가 카운터를 함께 본다. */
  token: number;
  show: (message: string) => void;
  clear: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  token: 0,
  show: (message) => set((s) => ({ message, token: s.token + 1 })),
  clear: () => set({ message: null }),
}));

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const area = document.createElement('textarea');
  area.value = value;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
}

/**
 * 프리미티브 색 박스 클릭용 헬퍼.
 * hex 문자열(#rrggbb)을 클립보드에 복사하고, 결과를 토스트로 보여준다.
 * navigator.clipboard이 거부되는 환경(비보안 컨텍스트 등)에서는 document.execCommand 폴백을 시도한다.
 */
export function useCopyHex() {
  const show = useToastStore((s) => s.show);
  const { t } = useTranslation('common');
  return useCallback(
    async (hex: string) => {
      const value = hex.toLowerCase();
      try {
        await copyText(value);
        show(t('toast.copiedHex', { hex: value }));
      } catch {
        show(t('toast.copyFailed'));
      }
    },
    [show, t],
  );
}

/** SVG 문자열을 클립보드에 쓰고 토스트로 결과를 알린다. */
export function useCopySvg() {
  const show = useToastStore((s) => s.show);
  const { t } = useTranslation('common');
  return useCallback(
    async (svg: string) => {
      try {
        await copyText(svg);
        show(t('toast.copiedSvg'));
      } catch {
        show(t('toast.copyFailed'));
      }
    },
    [show, t],
  );
}
