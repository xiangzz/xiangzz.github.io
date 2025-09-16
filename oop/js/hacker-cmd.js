document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.getElementById('terminal-animation');
    if (!terminal) return;

    const sequences = [
        { text: 'dir', type: 'command' },
        { text: '2025/08/06  16:57    &lt;DIR&gt;   .cache', type: 'output' },
        { text: 'echo "Hello World"', type: 'command' },
        { text: '"Hello World"', type: 'output' },
        { text: 'cls', type: 'command', clear: true },
        { text: 'echo "命令行也可以很有趣!"', type: 'command' },
        { text: '"命令行也可以很有趣!"', type: 'output' }
    ];

    let sequenceIndex = 0;

    function typewriter(element, text, callback, speed = 50) {
        let i = 0;
        element.innerHTML = ''; // Clear previous content
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.innerHTML = '&#9646;';
        element.appendChild(cursor);

        function type() {
            if (i < text.length) {
                element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
                i++;
                setTimeout(type, speed);
            } else {
                if (callback) callback();
            }
        }
        type();
    }

    function runSequence() {
        if (sequenceIndex >= sequences.length) {
            // Animation finished, maybe loop or hide cursor
            const lastElement = terminal.lastChild;
            if (lastElement && lastElement.querySelector) {
                const cursor = lastElement.querySelector('.cursor');
                if (cursor) {
                    cursor.style.display = 'none'; // Hide cursor at the end
                }
            }
            return;
        }

        const current = sequences[sequenceIndex];

        if (current.clear) {
            terminal.innerHTML = '';
        }

        const line = document.createElement('div');
        line.className = current.type; // 'command' or 'output'

        if (current.type === 'command') {
            const prompt = document.createElement('span');
            prompt.className = 'prompt';
            prompt.textContent = 'C:\\Users\\xzz> ';
            line.appendChild(prompt);

            const commandText = document.createElement('span');
            line.appendChild(commandText);
            terminal.appendChild(line);
            
            typewriter(commandText, current.text, () => {
                sequenceIndex++;
                setTimeout(runSequence, 500); // Wait after command
            }, 100);

        } else { // output
            line.innerHTML = current.text.replace(/\n/g, '<br>');
            terminal.appendChild(line);
            sequenceIndex++;
            setTimeout(runSequence, 200); // Wait after output
        }
    }
    
    // Use a MutationObserver to start the animation only when the slide becomes active.
    const observer = new MutationObserver((mutationsList, observer) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const targetElement = mutation.target;
                if (targetElement.classList.contains('active') && targetElement.classList.contains('hacker-terminal')) {
                    // Only start if it's not already running
                    if (!terminal.hasAttribute('data-animation-started')) {
                        terminal.setAttribute('data-animation-started', 'true');
                        setTimeout(runSequence, 500); // Initial delay
                    }
                }
            }
        }
    });

    const titleSlide = document.querySelector('.slide.title-slide.hacker-terminal');
    if (titleSlide) {
        observer.observe(titleSlide, { attributes: true });
        // Also check if it's active on load
        if (titleSlide.classList.contains('active')) {
            if (!terminal.hasAttribute('data-animation-started')) {
                terminal.setAttribute('data-animation-started', 'true');
                setTimeout(runSequence, 500); // Initial delay
            }
        }
    }
});