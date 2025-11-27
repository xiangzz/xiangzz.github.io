/**
 * 图片床路径替换器
 * 用于将本地图片路径替换为图床路径
 */
(function() {
    'use strict';
    
    // 配置图床基础URL - 修改这里即可更换图床
    const IMAGE_BED_BASE_URL = 'https://pic1.fukit.cn/autoupload/k8cnYUDWG-dBzNLixICGUdGNrBetXpGbNs1J43c0F6g/oop-img/';
    
    // 本地图片路径前缀（支持两种格式）
    const LOCAL_IMAGE_PREFIXES = ['./images/', 'images/'];
    
    // 等待DOM加载完成
    function replaceImagePaths() {
        // 获取所有img标签
        const images = document.querySelectorAll('img');
        
        // 替换每个图片的src属性
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                // 检查是否匹配任一前缀
                for (const prefix of LOCAL_IMAGE_PREFIXES) {
                    if (src.startsWith(prefix)) {
                        // 提取图片文件名
                        const filename = src.substring(prefix.length);
                        // 构建新的图床URL
                        const newSrc = IMAGE_BED_BASE_URL + filename;
                        // 替换src属性
                        img.setAttribute('src', newSrc);
                        // 找到匹配的前缀后，跳出循环
                        break;
                    }
                }
            }
        });
    }
    
    // 如果DOM已经加载完成，立即执行替换
    if (document.readyState === 'loading') {
        // DOM还在加载中，等待加载完成
        document.addEventListener('DOMContentLoaded', replaceImagePaths);
    } else {
        // DOM已经加载完成，立即执行
        replaceImagePaths();
    }
})();