-- RICOH GR IV 책 출간 안내 (원격 DB)
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --remote --file=./scripts/seed-notice-book-gr4-remote.sql
-- 이미 id=15가 있으면 update-notice-book-gr4.sql 사용
INSERT INTO notices (title, content, form_link, created_at, updated_at) VALUES (
  '신간 출간 안내: 《RICOH GR IV · 기초부터 응용까지 100% 활용 가이드》',
  '<p>안녕하세요, 올라포토입니다.<br>리코(RICOH) 유저분들을 위한 반가운 신간 소식을 전해드립니다.</p>
<p>리코의 최신 콤팩트 카메라 RICOH GR IV의 모든 기능을 한눈에 익히고 실전에서 완벽하게 다룰 수 있도록 돕는 친절한 안내서, 《RICOH GR IV · 기초부터 응용까지 100% 활용 가이드》가 정식 출간되었습니다.</p>
<p>단순한 기능 나열을 넘어, 카메라를 처음 손에 쥔 순간부터 나만의 시선을 담은 결과물을 만들어내기까지의 과정을 체계적으로 담아낸 실전형 가이드북입니다.</p>
<p><strong>📖 이 책에서 다루는 핵심 내용</strong></p>
<ul>
<li><strong>초기 설정의 정석:</strong> 개봉 직후 가장 먼저 세팅해야 할 필수 메뉴와 커스텀 세팅 노하우</li>
<li><strong>직관적인 조작법:</strong> 한 손 조작의 묘미를 극대화하는 버튼·다이얼 커스터마이징</li>
<li><strong>빛을 다루는 노출 보정:</strong> 스냅 촬영의 완성도를 높이는 상황별 노출 제어 기법</li>
<li><strong>정확하고 빠른 초점 모드:</strong> 풀프레스 스냅(Snap Focus)부터 트래킹까지 완벽 활용법</li>
<li><strong>창의적인 촬영 테크닉:</strong> 이미지 컨트롤(필름 시뮬레이션) 조합 및 실전 구도 팁</li>
</ul>
<p><strong>💡 이런 분들께 추천합니다</strong></p>
<ul>
<li>RICOH GR IV를 새로 구매했지만 방대한 기능 설정이 막막하신 분</li>
<li>매뉴얼의 딱딱한 설명 대신 실제 촬영에 바로 적용할 수 있는 팁이 필요하신 분</li>
<li>GR 시리즈 특유의 색감과 스냅 감성을 100% 끌어올리고 싶으신 분</li>
</ul>
<p><strong>🔗 도서 상세 정보 및 구매 안내</strong></p>
<p>자세한 목차와 미리보기는 아래 온라인 서점 및 인스타그램에서 확인하실 수 있습니다.</p>
<p><strong>도서 구매 바로가기:</strong> <a href="https://www.yes24.com/Product/Search?query=9791123072036" target="_blank" rel="noopener noreferrer">YES24에서 《RICOH GR IV · 기초부터 응용까지 100% 활용 가이드》 보기</a></p>
<p><strong>출간 소식 확인하기:</strong> <a href="https://www.instagram.com/p/Df3WFzViev3/" target="_blank" rel="noopener noreferrer">올라포토 공식 Instagram 게시물 보기</a></p>
<p>앞으로도 여러분의 즐거운 사진 생활에 도움이 되는 유익한 소식으로 찾아뵙겠습니다. 감사합니다.</p>',
  'https://www.instagram.com/p/Df3WFzViev3/',
  datetime('now'),
  datetime('now')
);
