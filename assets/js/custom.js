document.addEventListener("DOMContentLoaded", function () {
  var allPre = document.querySelectorAll(".post-content pre");

  allPre.forEach(function (pre) {
    // 1. 他の pre の内側にネストされている pre は除外
    if (pre.parentElement && pre.parentElement.closest("pre")) return;

    // 2. 行番号テーブル (table.linenotable) の内側にある pre は除外
    if (pre.closest("table.linenotable")) return;

    // 3. すでにラッパー処理済みの場合は除外
    if (pre.closest(".code-block-wrapper")) return;

    // 最外側の pre をラッパーで包む
    var wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // コピーボタンの生成
    var button = document.createElement("button");
    button.className = "copy-code-button";
    button.type = "button";
    button.setAttribute("aria-label", "コードをクリップボードにコピー");
    button.innerHTML = '<i class="fa-solid fa-copy"></i><span class="copy-text">コピー</span>';

    button.addEventListener("click", function () {
      var codeToCopy = "";

      // 行番号テーブルがある場合はコード本文列 (td.code) のみ取得
      var codeTable = wrapper.querySelector("table.linenotable");
      if (codeTable) {
        var codeCell = codeTable.querySelector("td.code");
        if (codeCell) {
          codeToCopy = codeCell.innerText;
        }
      } else {
        codeToCopy = pre.innerText;
      }

      // 末尾の余分な改行を削除
      codeToCopy = codeToCopy.replace(/\n+$/, "");

      navigator.clipboard.writeText(codeToCopy).then(function () {
        button.innerHTML = '<i class="fa-solid fa-check"></i><span class="copy-text">完了!</span>';
        button.classList.add("copied");

        setTimeout(function () {
          button.innerHTML = '<i class="fa-solid fa-copy"></i><span class="copy-text">コピー</span>';
          button.classList.remove("copied");
        }, 2000);
      }).catch(function (err) {
        console.error("コピーに失敗しました: ", err);
      });
    });

    wrapper.appendChild(button);
  });
});
