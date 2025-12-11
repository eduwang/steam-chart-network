# STEAM Chart Network

단어 관계망 분석을 통한 STEAM 베스트셀러 특징 및 동향 분석 프로젝트

## 📋 프로젝트 소개

본 프로젝트는 STEAM 플랫폼의 2019년부터 2023년까지 5년간의 베스트셀러 차트 데이터를 활용하여 게임의 특징과 트렌드를 분석하는 웹 애플리케이션입니다. 사용자 정의 태그(User-defined tag) 데이터를 기반으로 네트워크 그래프를 시각화하고, 중심성 분석 및 집단 탐색 기능을 제공합니다.

### 주요 기능

- **태그 관계망 그래프**: 사용자 정의 태그 간의 관계를 시각화
- **게임 관계망 그래프**: Jaccard 유사도를 기반으로 한 게임 간의 관계 시각화
- **연도별 데이터 필터링**: 2019년부터 2023년까지 연도별 데이터 선택 가능
- **플래티넘 티어 필터링**: 베스트셀러 차트 최상위권 게임 데이터만 필터링
- **중심성 계산**: 연결 중심성(Degree Centrality) 계산 및 표시
- **집단 탐색**: Louvain 알고리즘을 활용한 커뮤니티 탐지
- **인터랙티브 그래프**: 노드 호버 시 관련 노드 하이라이트 기능

## 🛠️ 기술 스택

### 프론트엔드
- **Vite** (^5.3.5) - 빌드 도구 및 개발 서버
- **HTML5 / CSS3** - 마크업 및 스타일링
- **JavaScript (ES6+)** - 핵심 로직

### 그래프 시각화 및 분석
- **Sigma.js** (^3.0.0-beta.25) - 그래프 시각화 라이브러리
- **Graphology** (^0.25.4) - 그래프 데이터 구조 및 분석
- **graphology-layout-forceatlas2** (^0.10.1) - Force Atlas 2 레이아웃 알고리즘
- **graphology-communities-louvain** (^2.0.1) - Louvain 커뮤니티 탐지 알고리즘
- **graphology-metrics** (^2.3.0) - 중심성 지표 계산
- **@sigma/node-border** (^3.0.0-beta.4) - 노드 테두리 렌더링

### 데이터 처리
- **PapaParse** (^5.4.1) - CSV 파일 파싱
- **seedrandom** (^3.0.5) - 시드 기반 랜덤 생성

## 📁 프로젝트 구조

```
steam-chart-network/
├── index.html              # 메인 HTML 파일
├── about.html              # About 페이지
├── graphVisualizer.js      # 그래프 시각화 및 분석 로직
├── styles.css              # 스타일시트
├── vite.config.js          # Vite 설정 파일
├── package.json            # 프로젝트 의존성 및 스크립트
├── data/                   # 원본 데이터 파일
│   ├── edges_btn_udt_*.csv          # 태그 간 관계 데이터 (연도별)
│   ├── edges_btn_udt_*_platinum.csv # 플래티넘 티어 태그 관계 데이터
│   ├── edges_btn_udt_5yrs.csv       # 5년 통합 태그 관계 데이터
│   ├── jaccard_*.csv                # 게임 간 Jaccard 유사도 데이터
│   ├── title_to_tag_*.csv          # 게임-태그 매핑 데이터
│   └── rank chart*.png              # 중심성 순위 변화 차트
├── public/                 # 정적 파일 (빌드 시 복사됨)
│   ├── data/               # 배포용 데이터 파일
│   └── source/             # 이미지 및 로고 파일
└── source/                 # 소스 이미지 파일
```

## 🚀 설치 및 실행

### 사전 요구사항

- Node.js (v16 이상 권장)
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd steam-chart-network

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173` (또는 표시된 포트)로 접속할 수 있습니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

## 📊 데이터 구조

### 태그 관계 데이터 (edges_btn_udt_*.csv)
- **Source1**: 첫 번째 태그
- **Source2**: 두 번째 태그
- **Weight**: 태그 간 공존 빈도 (가중치 5 이상만 포함)
- **Tier**: 게임 등급 (Platinum, Gold, Silver, Bronze)

### 게임 유사도 데이터 (jaccard_*.csv)
- **Source1**: 첫 번째 게임
- **Source2**: 두 번째 게임
- **Weight**: Jaccard 유사도 × 20 (가중치 5 이상만 포함)

## 🎯 사용 방법

### 그래프 보기

1. **태그 관계망 그래프**: 상단의 "사용자 정의 태그 사이의 관계망" 버튼 클릭
2. **게임 관계망 그래프**: 상단의 "게임 사이의 관계망" 버튼 클릭

### 데이터 필터링

- **연도별 데이터**: 우측 체크박스에서 원하는 연도 선택 (2019-2023, 5년간)
- **플래티넘 티어**: 플래티넘 티어 섹션에서 해당 연도 선택

### 분석 기능

- **중심성 계산**: "중심성 계산" 체크박스를 활성화하여 각 노드의 연결 중심성 확인
- **집단 찾기**: "집단 찾기" 체크박스를 활성화하여 Louvain 알고리즘으로 커뮤니티 탐지
  - `+` / `-` 버튼으로 집단 수 조절 (resolution 값 조정)

### 그래프 인터랙션

- **노드 호버**: 노드를 마우스로 호버하면 관련 노드와 연결만 하이라이트
- **그래프 드래그**: 그래프를 드래그하여 이동 가능
- **줌**: 마우스 휠로 확대/축소 가능

## 🌐 배포

### Netlify 배포

이 프로젝트는 Netlify를 통해 배포됩니다.

#### Netlify 설정

프로젝트 루트에 `netlify.toml` 파일을 생성하고 다음 내용을 추가하세요:

```toml
[build]
  image = "ubuntu-24.04"
  publish = "dist"
  command = "npm run build"
```

#### 빌드 이미지 업데이트

Netlify의 Focal 빌드 이미지 지원이 2026년 1월 1일에 종료되므로, Ubuntu Noble 24.04 빌드 이미지로 업데이트해야 합니다. 위의 설정에서 `image = "ubuntu-24.04"`로 설정하면 됩니다.

### 배포 설정

1. Netlify 대시보드에서 새 사이트 생성
2. GitHub 저장소 연결
3. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. 배포 완료

## 📈 연구 결과 요약

- **인기 태그**: Multiplayer, Singleplayer, Action, Adventure/Exploration, Open World, Co-op 등이 높은 중심성을 보임
- **트렌드 변화**: 최근 모험/탐험, 시뮬레이션 등 혼자 즐길 수 있는 게임에 대한 관심 증가
- **플래티넘 게임**: 멀티플레이어, 액션, 협동 게임이 압도적인 상위권 차지
- **커뮤니티 구조**: 액션, 공포, 시뮬레이션 게임이 주요 집단을 형성

## 👥 기여자

- 강민서, 류유현, 배윤진, 손다연, 정다해 (정왕고등학교)
- 유연주 (서울대학교 수학교육과)
- 왕효원 (서울대학교 수학교육과 대학원)

## 📄 라이선스

이 프로젝트는 2024 창의융합 진로캠프 프로젝트입니다.

## 🔗 관련 링크

- [2019년 Best Sellers Chart](https://store.steampowered.com/sale/2019_top_sellers/)
- [2020년 Best Sellers Chart](https://store.steampowered.com/sale/BestOf2020)
- [2021년 Best Sellers Chart](https://store.steampowered.com/sale/BestOf2021)
- [2022년 Best Sellers Chart](https://store.steampowered.com/sale/BestOf2022)
- [2023년 Best Sellers Chart](https://store.steampowered.com/sale/BestOf2023)

## 📝 참고사항

- 데이터는 STEAM 공식 베스트셀러 차트에서 수집되었습니다.
- 사용자 정의 태그는 사용자가 직접 추가한 태그로, 중복 및 모호성을 해결하기 위해 전처리 과정을 거쳤습니다.
- 그래프 레이아웃은 Force Atlas 2 알고리즘을 사용하며, 시드값('2024')을 고정하여 재현 가능한 결과를 제공합니다.

