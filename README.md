# PoE SSF Filter Customizer

Path of Exile **SSF(솔로 셀프파운드)** 유니크 수집용 아이템 필터 커스터마이저.
유니크 수집 현황 CSV를 올리면, **한 베이스타입의 유니크를 전부 모은 베이스는 `Hide`**,
**아직 안 모은 유니크가 남은 베이스는 `Show`** 하도록 NeverSink 필터를 자동 수정한다.

백엔드·로그인 없는 완전 클라이언트 사이드 정적 SPA (Vite + React + TS). 업로드한 파일은
브라우저 밖으로 나가지 않는다.

## 왜?

SSF에서는 중복 유니크가 판매 가치가 없다. 유니크는 미감정으로 떨어져 **베이스만 보이므로**,
그 베이스에서 나올 수 있는 유니크를 전부 모았다면 해당 베이스의 유니크 드랍은 더 볼 필요가 없다.
반대로 아직 못 모은 유니크가 남은 베이스는 엄격한 필터에서도 놓치지 않게 강조해서 보여준다.

## 사용법

1. **CSV 업로드** — **PoE ladder에 로그인해 export한 CSV** (`name, baseItem, category, owned, grouping …`).
   보유 여부는 `owned` 컬럼(`1` = 보유)으로 판별하므로, 실제 수집 현황이 반영되려면 반드시
   ladder에 로그인한 상태로 export해야 한다.
   형식 참고용 샘플: [`sample-uniques.csv`](./sample-uniques.csv) (전부 미보유 상태 → 모든 베이스가 "필요"로 표시, Show·드릴다운 시연용).
2. **NeverSink 필터 선택** — 내 `.filter` 업로드 또는 GitHub에서 strictness 프리셋 fetch.
3. **옵션 조정** — "드랍 가능 유형(grouping)" 토글로 완료 판정 기준을 조절.
   기본값은 몬스터 자연 드랍이 불가능한 `Vaal_Orb`·`Recipe`를 제외. 카테고리 단위 제외도 가능.
4. **다운로드** — 생성된 `Show`/`Hide` 블록을 원본 필터 맨 앞에 붙여 내려받는다.

### 완료 판정 규칙

`baseItem`으로 그룹핑해, **선택된 드랍 가능 유형에 속한 유니크가 전부 보유되면** 그 베이스는
완료(Hide). 드랍 불가로 꺼둔 유형의 미보유 유니크는 파밍 중 어차피 안 나오므로 판정에서 무시한다.

## 필터 수정 방식

NeverSink 내부 구조를 파싱하지 않는다. 필터는 first-match-wins이므로 두 블록을 **맨 앞에 prepend**만
한다 (완료/미완료 두 목록은 서로소). NeverSink 버전·리그가 바뀌어도 깨지지 않는다.

```
# SSF still-needed uniques (generated)
Show
    Rarity Unique
    BaseType == "Sage's Robe" ...
    SetBorderColor 255 200 0

# SSF collected-base hide (generated)
Hide
    Rarity Unique
    BaseType == "Onyx Amulet" ...
```

> 필터의 `BaseType`은 항상 **영어**다(게임 필터는 내부 영문명으로 매칭). 화면의 EN↔KO 토글은
> 표시 전용이며 필터 출력 언어에는 영향을 주지 않는다. (한글 이름 데이터는 `src/data/ko-names.ts`에
> 채우면 화면 표시가 전환된다.)

## 개발

```sh
npm install
npm run dev      # 개발 서버 (localhost:5173)
npm test         # 완료 판정 로직 self-check
npm run build    # 정적 빌드 -> dist/
```

## 라이선스

MIT
