# RSS 섹션별 매핑 정리

## 개요

네이버 블로그 RSS (`holaphotograph`)의 각 글은 **카테고리** 기준으로 아래 3개 섹션 중 하나에 배치됩니다.

| 섹션 | 표시 제목 | 매칭 카테고리 |
|------|-----------|---------------|
| **reviews** | 리뷰 | guides, models에 해당하지 않는 **그 외 모든 카테고리** |
| **guides** | 위클리 포커스 & 카메라 소식 | 강의, 예약, 세미나, 클래스, 교육, Weekly Focus, 카메라 소식 |
| **models** | 렌즈 & 액세서리 | 시그마, 렌즈, 삼양, 빌트록스, Accessory, 피지테크, Viltrox, Sigm |

---

## 매핑 로직 (`worker/src/index.ts`)

```ts
function getRssSection(category: string): "reviews" | "guides" | "models" {
  const c = category.toLowerCase();
  // 1순위: 입문자 가이드
  if (/강의|예약|세미나|클래스|교육|weekly focus|카메라 소식/.test(c)) return "guides";
  // 2순위: 카메라 모델별 리뷰
  if (/시그마|렌즈|삼양|빌트록스|accessory|피지테크|viltrox|sigm/.test(c)) return "models";
  // 3순위: 최신 리뷰 (나머지)
  return "reviews";
}
```

---

## 예시

| 블로그 카테고리 | → 섹션 |
|-----------------|--------|
| 강의, 예약, 세미나, 클래스, 교육, Weekly Focus, 카메라 소식 | 위클리 포커스 & 카메라 소식 |
| 시그마, 렌즈, 삼양, 빌트록스, Accessory, 피지테크, Viltrox, Sigm | 렌즈 & 액세서리 |
| 리뷰, 비교, 사용기, 소개, 기타 등 위에 없는 모든 카테고리 | 리뷰 |

---

## 수정 방법

매핑을 바꾸려면 `worker/src/index.ts`의 `getRssSection` 함수를 수정한 뒤 Worker를 재배포하면 됩니다.
