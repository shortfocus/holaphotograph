-- 로컬: 2번 공지글 내용을 요청 구조로 수정 (이미지 순서·줄바꿈 반영)
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --local --file=./scripts/update-notice-class-content-local.sql
UPDATE notices SET content = '<p>일타강사 올라포토의 X-E5 매뉴얼 강의와 노출3요소 강의를 오프라인에서 만나보세요.<br>많은분들이 기다리셨던 이번 강의 놓치지 마세요🧑‍🎨</p>

<p><strong>이런 분들께 추천드립니다!</strong></p>
<ul><li>✔️ X-E5를 잘 다루고 싶은 유저</li></ul>

<p><img src="/images/class-exposure.png" alt="노출3요소 class 포스터" style="max-width:100%;height:auto;" /></p>

<p><strong>Class1</strong><br>오전 10시 ~ 12시 (X-E5 매뉴얼 강의)</p>
<ul>
<li>✔️ 55분 : X-E5 개념 완성</li>
<li>쉬는 시간 5분</li>
<li>✔️ 50분 : X-E5 심화 학습</li>
<li>✔️ 10분 : Q&amp;A 및 마무리</li>
</ul>

<p><img src="/images/class-xe5.png" alt="X-E5 class 포스터" style="max-width:100%;height:auto;" /></p>

<p><strong>Class2</strong><br>오후 1시 ~ 3시 (노출의 3요소 강의)</p>
<ul>
<li>✔️ 55분 : 노출모드(A모드와 조리개)</li>
<li>쉬는 시간 5분</li>
<li>✔️ 30분 : 노출모드(S모드와 셔터스피드)</li>
<li>✔️ 20분 : 노출모드(M모드와 ISO)</li>
<li>✔️ 10분 : Q&amp;A및 마무리</li>
</ul>

<p><strong>비용 :</strong> 각 2만원 (김성민 국민은행 907601-00-006780)</p>

<p><a href="https://forms.gle/aKXZjYLwgDGMd8qX6" target="_blank" rel="noopener">신청 폼 링크</a></p>', updated_at = datetime('now') WHERE id = 2;
