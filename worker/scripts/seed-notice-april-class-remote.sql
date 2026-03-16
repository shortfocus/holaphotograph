-- 4월 강의 안내 공지 (원격 DB 등록)
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --remote --file=./scripts/seed-notice-april-class-remote.sql
INSERT INTO notices (title, content, form_link, created_at, updated_at) VALUES (
  '4월 강의 안내',
  '<p>후지필름 카메라 클래스 누적 수강생 1위!</p>
<p>4월 일타강사 올라포토의 X-E5 매뉴얼 강의 듣고 함께 출사도 떠나보아요<br>많은분들이 기다리셨던 올라포토 출사 이번 강의 놓치지 마세요🧑‍🎨</p>
<p><strong>이런 분들께 추천드립니다!</strong><br>✔️ X-E5를 잘 다루고 싶은 유저</p>
<p><strong>Class1</strong><br>오전 10시 ~ 12시 (X-E5 매뉴얼 강의)</p>
<ul>
<li>✔️ 55분 : X-E5 개념 완성</li>
<li>- 쉬는 시간 5분</li>
<li>✔️ 50분 : X-E5 심화 학습</li>
<li>✔️ 10분 : Q&A 및 마무리</li>
</ul>
<p><strong>Class2</strong><br>오후 1시 ~ 3시 (국립 중앙 박물관 출사)</p>
<ul>
<li>✔️ 90분 : 국립중앙박물관 출사</li>
<li>✔️ 30분 : Q&A 및 마무리</li>
</ul>
<p><strong>비용 :</strong> 각 2만원 (김성민 국민은행 907601-00-006780)</p>',
  NULL,
  datetime('now'),
  datetime('now')
);
