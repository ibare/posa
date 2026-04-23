/**
 * 얇은 re-export 레이어.
 * IR의 최종 색 resolve 로직은 src/ir/selectors.ts에 있으며,
 * 이 파일은 색 유틸 모듈들이 selectors를 직접 import하지 않도록 여기서 중계한다.
 */
export {
  resolveAttributeColor,
  resolveSymbolColor,
  resolveSlotStateColor,
} from '../ir/selectors';
