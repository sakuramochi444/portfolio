// DOMが完全に読み込まれた後に実行される関数
document.addEventListener('DOMContentLoaded', function() {
    const postList = document.getElementById('postList'); // 投稿リストの要素を取得
    const savedPosts = JSON.parse(localStorage.getItem('posts')) || []; // ローカルストレージから投稿を取得（なければ空配列）

    // 保存された投稿を表示
    for (let i = 0; i < savedPosts.length; i++) {
        const post = savedPosts[i];
        const newPost = createElement(i, post.content, post.replies, post.time, post.category); // 投稿要素を生成
        postList.prepend(newPost); // 投稿をリストの先頭に追加
    }

    // ドロップダウンメニューの表示切替
    postList.addEventListener('click', function(event) {
        if (event.target.classList.contains('dropbtn')) {
            const dropdownContent = event.target.nextElementSibling; // ドロップダウンのコンテンツを取得
            document.querySelectorAll('.dropdown-content').forEach(function(content) {
                content.style.display = 'none'; // 他のドロップダウンを非表示にする
            });
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block'; // クリックしたドロップダウンを切替
            event.stopPropagation(); // イベントの伝播を止める
        } else {
            document.querySelectorAll('.dropdown-content').forEach(function(content) {
                content.style.display = 'none'; // ドロップダウンを非表示にする
            });
        }
    });
});

document.getElementById('categoryFilter').addEventListener('change', function() {
    const selectedCategory = this.value;
    filterPosts(selectedCategory);
});

// 新しい投稿や返信をローカルストレージに保存する関数
function saveItem(type, index, content, category) {
    const posts = JSON.parse(localStorage.getItem('posts')) || []; // 現在の投稿を取得
    const currentTime = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '/'); // 現在の時間をフォーマット

    // 投稿または返信を追加
    if (type === 'post') {
        posts.push({ content: content, replies: [], time: currentTime, category: category || '未設定' }); // 投稿を追加
    } else if (type === 'reply' && index !== null) {
        posts[index].replies.push({ content: content, time: currentTime }); // 返信を追加
    }
    localStorage.setItem('posts', JSON.stringify(posts)); // 更新された投稿をローカルストレージに保存
}

// 投稿または返信を削除する関数
function removeItem(type, postIndex, replyIndex) {
    const posts = JSON.parse(localStorage.getItem('posts')) || []; // 現在の投稿を取得
    if (type === 'post') {
        posts.splice(postIndex, 1); // 投稿を削除
    } else if (type === 'reply') {
        posts[postIndex].replies.splice(replyIndex, 1); // 返信を削除
    }
    localStorage.setItem('posts', JSON.stringify(posts)); // 更新された投稿をローカルストレージに保存
}

// 投稿または返信を更新する関数
function updateItem(type, postIndex, replyIndex, newContent) {
    const posts = JSON.parse(localStorage.getItem('posts')) || []; // 現在の投稿を取得
    if (type === 'post') {
        posts[postIndex].content = newContent; // 投稿の内容を更新
    } else if (type === 'reply') {
        posts[postIndex].replies[replyIndex].content = newContent; // 返信の内容を更新
    }
    localStorage.setItem('posts', JSON.stringify(posts)); // 更新された投稿をローカルストレージに保存
}

// 投稿のHTML要素を生成する関数
function createElement(id, content, replies, time, category) {
    const newElement = document.createElement('div'); // 新しいdiv要素を作成
    newElement.className = 'post'; // クラス名を設定
    const safeContent = content ? escapeHtml(content) : ''; // 特殊文字をエスケープ
    const safeTime = time ? time : 'N/A'; // 時間を設定
    const safeCategory = category ? escapeHtml(category) : '未設定'; // カテゴリを設定
    newElement.innerHTML = `
        <p>${safeContent}</p>
        <span class="category">カテゴリー：${safeCategory}</span>
        <br>
        <span class="time">${safeTime}</span>
        <div class="dropdown">
            <button class="dropbtn">⋮</button>
            <div class="dropdown-content">
                <a href="#" onclick="editItem(this, 'post')">編集</a>
                <a href="#" onclick="deleteItem(this, 'post')">削除</a>
            </div>
        </div>
        <details>
            <summary>コメントを表示</summary>
            <div class="replyForm">
                <textarea rows="2" placeholder="返信を入力してください..."></textarea>
                <button class="button" onclick="submitReply(this)">返信する</button>
            </div>
            <div class="replyList"></div>
        </details>
    `;

    newElement.setAttribute('data-id', id); // データ属性を設定
    
    const replyList = newElement.querySelector('.replyList'); // 返信リストを取得
    replies.forEach(function(reply) {
        const replyElement = createReplyElement(reply.content, reply.time); // 返信要素を生成
        replyList.appendChild(replyElement); // 返信要素をリストに追加
    });
    
    return newElement; // 生成した投稿要素を返す
}

// 返信のHTML要素を生成する関数
function createReplyElement(replyContent, replyTime) {
    const newReply = document.createElement('div'); // 新しいdiv要素を作成
    newReply.className = 'reply'; // クラス名を設定
    const safeReplyContent = replyContent ? escapeHtml(replyContent) : ''; // 特殊文字をエスケープ
    const safeReplyTime = replyTime ? replyTime : 'N/A'; // 時間を設定
    newReply.innerHTML = `
        <div class="reply-content">${safeReplyContent}</div>
        <span class="time">${safeReplyTime}</span>
        <div class="dropdown">
            <button class="dropbtn">⋮</button>
            <div class="dropdown-content">
                <a href="#" onclick="editItem(this, 'reply')">編集</a>
                <a href="#" onclick="deleteItem(this, 'reply')">削除</a>
            </div>
        </div>
    `; // 内部のHTMLを設定
    return newReply; // 生成した返信要素を返す
}

// 投稿を送信する関数
function submitPost() {
    const content = document.getElementById('postContent').value; // 投稿内容を取得
    const category = document.getElementById('categorySelect').value; // カテゴリを取得

    if (content) { // 内容が空でない場合
        const posts = JSON.parse(localStorage.getItem('posts')) || []; // 現在の投稿を取得
        const currentTime = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '/'); // 現在の時間をフォーマット
        posts.push({ content, replies: [], time: currentTime, category: category || '未設定' }); // 投稿を追加
        localStorage.setItem('posts', JSON.stringify(posts)); // 更新された投稿をローカルストレージに保存
        document.getElementById('postContent').value = ''; // 投稿入力をリセット
        document.getElementById('categorySelect').value = ''; // カテゴリ選択をリセット
        displayPosts(); // 投稿を再表示
    }
}

// 返信を送信する関数
function submitReply(button) {
    const replyContent = button.previousElementSibling.value.trim(); // 返信内容を取得
    if (replyContent !== '') { // 内容が空でない場合
        const postElement = button.closest('.post'); // 親の投稿要素を取得
        const replyList = postElement.querySelector('.replyList'); // 返信リストを取得
        const currentTime = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '/'); // 現在の時間をフォーマット
        const newReply = createReplyElement(replyContent, currentTime); // 返信要素を生成
        replyList.appendChild(newReply); // 返信要素をリストに追加
        button.previousElementSibling.value = ''; // 返信入力をリセット
        const index = parseInt(postElement.getAttribute('data-id'), 10); // 投稿のインデックスを取得
        saveItem('reply', index, replyContent); // 返信をローカルストレージに保存
    }
}

// 投稿または返信を削除する関数
function deleteItem(button, type) {
    const element = button.closest(type === 'post' ? '.post' : '.reply'); // 削除する要素を取得
    const postElement = button.closest('.post'); // 親の投稿要素を取得
    const postIndex = postElement.getAttribute('data-id'); // 投稿のインデックスを取得

    if (type === 'post') {
        element.remove(); // 投稿要素を削除
        removeItem(type, postIndex); // ローカルストレージから削除
    } else {
        const replyList = button.closest('.replyList'); // 返信リストを取得
        const replyIndex = Array.from(replyList.children).indexOf(element); // 返信のインデックスを取得
        element.remove(); // 返信要素を削除
        removeItem(type, postIndex, replyIndex); // ローカルストレージから削除
    }
}

// 編集関数
function editItem(button, type) {
    // すでに編集中の要素を見つけて、通常の表示に戻す
    const currentlyEditing = document.querySelector('.edit-textarea');
    if (currentlyEditing) {
        const postElement = currentlyEditing.closest(type === 'post' ? '.post' : '.reply');
        const contentElement = type === 'post' ? postElement.querySelector('p') : postElement.querySelector('.reply-content');
        contentElement.innerHTML = escapeHtml(contentElement.dataset.originalContent);
    }

    const element = button.closest(type === 'post' ? '.post' : '.reply');
    const contentElement = type === 'post' ? element.querySelector('p') : element.querySelector('.reply-content');
    
    // 現在の内容を保存しておく
    contentElement.dataset.originalContent = contentElement.innerText;

    const textarea = document.createElement('textarea');
    textarea.value = contentElement.innerText;
    textarea.className = 'edit-textarea';

    const completeButton = document.createElement('button');
    completeButton.innerText = '完了';
    completeButton.className = 'button';
    completeButton.onclick = function(event) {
        event.preventDefault(); // デフォルトの動作を防ぐ
        const newContent = textarea.value;
        contentElement.innerHTML = escapeHtml(newContent);
        const postIndex = element.closest('.post').getAttribute('data-id');
        const replyIndex = type === 'reply' ? Array.from(element.parentNode.children).indexOf(element) : null;
        updateItem(type, postIndex, replyIndex, newContent);
    };


    contentElement.innerHTML = '';
    contentElement.append(textarea, completeButton);
    textarea.focus();
}

// カテゴリでフィルタリングする関数
function filterPosts(category) {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const postList = document.getElementById('postList');
    postList.innerHTML = '';
    
    posts.forEach((post, index) => {
        if (category === '全て' || post.category === category) {
            const newPost = createElement(index, post.content, post.replies, post.time, post.category);
            postList.prepend(newPost);
        }
    });
}

// HTMLの特殊文字をエスケープする関数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}

// 投稿を再表示する関数
function displayPosts() {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const postList = document.getElementById('postList');
    postList.innerHTML = '';
    
    posts.forEach(function(post, index) {
        const newPost = createElement(index, post.content, post.replies, post.time, post.category);
        postList.prepend(newPost);
    });
}

// 投稿削除の機能
function clearLocalStorage(){
    localStorage.removeItem('posts');
    alert("全投稿が削除されました！");
    location.reload();  // ページをリロードして初期状態に戻す
};