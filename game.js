const RAD = Math.PI / 180;
const scrn = document.getElementById('canvas');
const sctx = scrn.getContext("2d");
const ScreenWidth = 276;
const ScreenHeight = 414;
scrn.tabIndex = 1;
scrn.addEventListener("click", () => {
    switch (state.curr) {
        case state.getReady:
            state.curr = state.Play;
            SFX.start.play();
            break;
        case state.Play:
            bird.flap();
            break;
        case state.gameOver:
            state.curr = state.ScoreBoard;
            bird.speed = 0;
            bird.y = 100;
            pipe.pipes = [];
            UI.score.curr = 0;
            SFX.played = false;

            UI.score_cache = [];
            UI.score_sent = false;

            if (UI.score_sent == false) {
                set_score(UI.score.curr).then((result) => {
                    get_score(UI.score.curr).then((result) => {
                        UI.score_cache = result;
                        UI.score_sent = true;
                    }
                    );
                });

            }
            break;
        case state.ScoreBoard:
            state.curr = state.getReady;
            break;
    }
})

scrn.onkeydown = function keyDown(e) {
    if (e.keyCode == 32 || e.keyCode == 87 || e.keyCode == 38)   // Space Key or W key or arrow up
    {
        switch (state.curr) {
            case state.getReady:
                state.curr = state.Play;
                SFX.start.play();
                break;
            case state.Play:
                bird.flap();
                break;
            case state.gameOver:
                state.curr = state.ScoreBoard;
                bird.speed = 0;
                bird.y = 100;
                pipe.pipes = [];
                UI.score.curr = 0;
                SFX.played = false;

                UI.score_cache = [];
                UI.score_sent = false;

                if (UI.score_sent == false) {
                    set_score(UI.score.curr).then((result) => {
                        get_score(UI.score.curr).then((result) => {
                            UI.score_cache = result;
                            UI.score_sent = true;
                        }
                        );
                    });

                }
                break;
            case state.ScoreBoard:
                state.curr = state.getReady;
                break;
        }
    }
}



let frames = 0;
let dx = 2;
const state = {
    curr: 0,
    getReady: 0,
    Play: 1,
    gameOver: 2,
    ScoreBoard: 3,
}
const SFX = {
    start: new Audio(),
    flap: new Audio(),
    score: new Audio(),
    hit: new Audio(),
    die: new Audio(),
    played: false
}
const gnd = {
    sprite: new Image(),
    x: 0,
    y: 0,
    draw: function () {
        this.y = parseFloat(ScreenHeight - this.sprite.height);
        sctx.drawImage(this.sprite, this.x, this.y);
    },
    update: function () {
        if (state.curr != state.Play) return;
        this.x -= dx;
        this.x = this.x % (this.sprite.width / 2);
    }
};
const bg = {
    sprite: new Image(),
    x: 0,
    y: 0,
    draw: function () {
        y = parseFloat(ScreenHeight - this.sprite.height);
        sctx.drawImage(this.sprite, this.x, y);
    }
};
const pipe = {
    top: { sprite: new Image() },
    bot: { sprite: new Image() },
    gap: 85,
    moved: true,
    pipes: [],
    draw: function () {
        for (let i = 0; i < this.pipes.length; i++) {
            let p = this.pipes[i];
            sctx.drawImage(this.top.sprite, p.x, p.y)
            sctx.drawImage(this.bot.sprite, p.x, p.y + parseFloat(this.top.sprite.height) + this.gap)
        }
    },
    update: function () {
        if (state.curr != state.Play) return;
        if (frames % 100 == 0) {
            this.pipes.push({ x: parseFloat(ScreenWidth), y: -210 * Math.min(Math.random() + 1, 1.8) });
        }
        this.pipes.forEach(pipe => {
            pipe.x -= dx;
        })

        if (this.pipes.length && this.pipes[0].x < -this.top.sprite.width) {
            this.pipes.shift();
            this.moved = true;
        }

    }

};
const bird = {
    animations:
        [
            { sprite: new Image() },
            { sprite: new Image() },
            { sprite: new Image() },
            { sprite: new Image() },
        ],
    rotatation: 0,
    x: 50,
    y: 100,
    speed: 0,
    gravity: .125,
    thrust: 3.6,
    frame: 0,
    draw: function () {
        let h = this.animations[this.frame].sprite.height;
        let w = this.animations[this.frame].sprite.width;
        sctx.save();
        sctx.translate(this.x, this.y);
        sctx.rotate(this.rotatation * RAD);
        sctx.drawImage(this.animations[this.frame].sprite, -w / 2, -h / 2);
        sctx.restore();
    },
    update: function () {
        let r = parseFloat(this.animations[0].sprite.width) / 2;
        switch (state.curr) {
            case state.getReady:
                this.rotatation = 0;
                this.y += (frames % 10 == 0) ? Math.sin(frames * RAD) : 0;
                this.frame += (frames % 10 == 0) ? 1 : 0;
                break;
            case state.Play:
                this.frame += (frames % 5 == 0) ? 1 : 0;
                this.y += this.speed;
                this.setRotation()
                this.speed += this.gravity;
                if (this.y + r >= gnd.y || this.collisioned()) {
                    state.curr = state.gameOver;
                }

                break;
            case state.gameOver:
                this.frame = 1;
                if (this.y + r < gnd.y) {
                    this.y += this.speed;
                    this.setRotation()
                    this.speed += this.gravity * 2;
                }
                else {
                    this.speed = 0;
                    this.y = gnd.y - r;
                    this.rotatation = 90;
                    if (!SFX.played) {
                        SFX.die.play();
                        SFX.played = true;
                    }
                }

                break;
        }
        this.frame = this.frame % this.animations.length;
    },
    flap: function () {
        if (this.y > 0) {
            SFX.flap.play();
            this.speed = -this.thrust;
        }
    },
    setRotation: function () {
        if (this.speed <= 0) {

            this.rotatation = Math.max(-25, -25 * this.speed / (-1 * this.thrust));
        }
        else if (this.speed > 0) {
            this.rotatation = Math.min(90, 90 * this.speed / (this.thrust * 2));
        }
    },
    collisioned: function () {
        if (!pipe.pipes.length) return;
        let bird = this.animations[0].sprite;
        let x = pipe.pipes[0].x;
        let y = pipe.pipes[0].y;
        let r = bird.height / 4 + bird.width / 4;
        let roof = y + parseFloat(pipe.top.sprite.height);
        let floor = roof + pipe.gap;
        let w = parseFloat(pipe.top.sprite.width);
        if (this.x + r >= x) {
            if (this.x + r < x + w) {
                if (this.y - r <= roof || this.y + r >= floor) {
                    SFX.hit.play();
                    return true;
                }

            }
            else if (pipe.moved) {
                UI.score.curr++;
                SFX.score.play();
                pipe.moved = false;
            }



        }
    }
};
const UI = {
    getReady: { sprite: new Image() },
    gameOver: { sprite: new Image() },
    tap: [{ sprite: new Image() },
    { sprite: new Image() }],
    score: {
        curr: 0,
        best: 0,
    },
    score_cache: [],
    score_sent: false,
    user_name: "기본이름",
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    frame: 0,
    draw: async function () {
        switch (state.curr) {
            case state.getReady:
                this.y = parseFloat(ScreenHeight - this.getReady.sprite.height) / 2;
                this.x = parseFloat(ScreenWidth - this.getReady.sprite.width) / 2;
                this.tx = parseFloat(ScreenWidth - this.tap[0].sprite.width) / 2;
                this.ty = this.y + this.getReady.sprite.height - this.tap[0].sprite.height;
                sctx.drawImage(this.getReady.sprite, this.x, this.y);
                sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty)
                break;
            case state.gameOver:
                this.y = parseFloat(ScreenHeight - this.gameOver.sprite.height) / 2;
                this.x = parseFloat(ScreenWidth - this.gameOver.sprite.width) / 2;
                this.tx = parseFloat(ScreenWidth - this.tap[0].sprite.width) / 2;
                this.ty = this.y + this.gameOver.sprite.height - this.tap[0].sprite.height;
                sctx.drawImage(this.gameOver.sprite, this.x, this.y);
                sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty)
                break;
            case state.ScoreBoard:
                sctx.fillStyle = "#FFFFFF";
                sctx.strokeStyle = "#000000";
                sctx.lineWidth = "2";
                sctx.font = "40px Squada One";
                txtScoreBoard = "랭킹"
                sctx.fillText(txtScoreBoard, ScreenWidth / 2 - 40, ScreenHeight / 2 - 150);
                sctx.strokeText(txtScoreBoard, ScreenWidth / 2 - 40, ScreenHeight / 2 - 150);
                break;
        }
        this.drawScore();
    },
    drawScore: async function () {
        sctx.fillStyle = "#FFFFFF";
        sctx.strokeStyle = "#000000";
        switch (state.curr) {
            case state.Play:
                sctx.lineWidth = "2";
                sctx.font = "35px Squada One";
                sctx.fillText(this.score.curr, ScreenWidth / 2 - 5, 50);
                sctx.strokeText(this.score.curr, ScreenWidth / 2 - 5, 50);
                break;
            case state.gameOver:
                sctx.lineWidth = "2";
                sctx.font = "40px Squada One";
                let sc = `SCORE :     ${this.score.curr}`;
                try {
                    this.score.best = Math.max(this.score.curr, localStorage.getItem("best"));
                    localStorage.setItem("best", this.score.best);
                    let bs = `BEST  :     ${this.score.best}`;
                    sctx.fillText(sc, ScreenWidth / 2 - 80, ScreenHeight / 2 + 0);
                    sctx.strokeText(sc, ScreenWidth / 2 - 80, ScreenHeight / 2 + 0);
                    sctx.fillText(bs, ScreenWidth / 2 - 80, ScreenHeight / 2 + 30);
                    sctx.strokeText(bs, ScreenWidth / 2 - 80, ScreenHeight / 2 + 30);
                }
                catch (e) {
                    sctx.fillText(sc, ScreenWidth / 2 - 85, ScreenHeight / 2 + 15);
                    sctx.strokeText(sc, ScreenWidth / 2 - 85, ScreenHeight / 2 + 15);
                }

                break;
            case state.ScoreBoard:
                sctx.lineWidth = "2";
                sctx.font = "30px Squada One";
                if (UI.score_sent == false) {
                    break;
                }

                let cnt = 0;
                let am_i_top_10 = false;
                for (let i = 0; i < UI.score_cache.length; i++) {
                    if (UI.score_cache[i].score == UI.score.curr) {
                        cnt++;
                        sctx.fillStyle = "#008000";
                        sctx.strokeStyle = "#000000";
                        sctx.fillText(`${cnt}등 ${UI.score_cache[i].name} : ${UI.score_cache[i].score} ${UI.score_cache[i].unit}`, ScreenWidth / 2 - 80, ScreenHeight / 2 - 120 + 30 * i);
                        sctx.strokeText(`${cnt}등 ${UI.score_cache[i].name} : ${UI.score_cache[i].score} ${UI.score_cache[i].unit}`, ScreenWidth / 2 - 80, ScreenHeight / 2 - 120 + 30 * i);
                        sctx.fillStyle = "#FFFFFF";
                        sctx.strokeStyle = "#000000";
                        am_i_top_10 = true;
                    }
                    else {
                        cnt++;
                        sctx.fillStyle = "#FFFFFF";
                        sctx.strokeStyle = "#000000";
                        sctx.fillText(`${cnt}등 ${UI.score_cache[i].name} : ${UI.score_cache[i].score} ${UI.score_cache[i].unit}`, ScreenWidth / 2 - 80, ScreenHeight / 2 - 100 + 30 * i);
                        sctx.strokeText(`${cnt}등 ${UI.score_cache[i].name} : ${UI.score_cache[i].score} ${UI.score_cache[i].unit}`, ScreenWidth / 2 - 80, ScreenHeight / 2 - 100 + 30 * i);
                    }
                    if (cnt == 10) break;
                }
                if (am_i_top_10 == false) {
                    sctx.fillText(`=========================================`, ScreenWidth / 2 - 80, ScreenHeight / 2 - 100 + 30 * cnt);
                    sctx.fillStyle = "#008000";
                    sctx.strokeStyle = "#000000";
                    sctx.fillText(`${cnt}등 ${UI.user_name} : ${UI.score.curr} ${UI.score_cache[i].unit}`, ScreenWidth / 2 - 80, ScreenHeight / 2 - 100 + 30 * cnt);
                    sctx.strokeText(`${cnt}등 ${UI.user_name} : ${UI.score.curr} ${UI.score_cache[i].unit}`, ScreenWidth / 2 - 80, ScreenHeight / 2 - 100 + 30 * cnt);
                }
                break;

        }
    },
    update: function () {
        if (state.curr == state.Play) return;
        this.frame += (frames % 10 == 0) ? 1 : 0;
        this.frame = this.frame % this.tap.length;
    }

};

gnd.sprite.src = "img/ground.png";
bg.sprite.src = "img/BG.png";
pipe.top.sprite.src = "img/toppipe.png";
pipe.bot.sprite.src = "img/botpipe.png";
UI.gameOver.sprite.src = "img/go.png";
UI.getReady.sprite.src = "img/getready.png";
UI.tap[0].sprite.src = "img/tap/t0.png";
UI.tap[1].sprite.src = "img/tap/t1.png";
UI.user_name = prompt('이름을 입력하세요', '이름');
bird.animations[0].sprite.src = "img/bird/b0.png";
bird.animations[1].sprite.src = "img/bird/b1.png";
bird.animations[2].sprite.src = "img/bird/b2.png";
bird.animations[3].sprite.src = "img/bird/b0.png";
SFX.start.src = "sfx/start.wav"
SFX.flap.src = "sfx/flap.wav"
SFX.score.src = "sfx/score.wav"
SFX.hit.src = "sfx/hit.wav"
SFX.die.src = "sfx/die.wav"

gameLoop();

function gameLoop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(gameLoop);
}

function update() {
    bird.update();
    gnd.update();
    pipe.update();
    UI.update();
}
function draw() {
    //width 276
    //height 414
    var ScreenRatio = 1;

    var sizeWidth = window.innerWidth;
    var sizeHeight = window.innerHeight;

    if(sizeWidth/276 * 414 > sizeHeight){
        ScreenRatio = sizeHeight / 414;
    } else {
        ScreenRatio = sizeWidth / 276;
    }
    ScreenRatio -= 0.05;

    scrn.width = ScreenWidth*ScreenRatio;
    scrn.height = ScreenHeight*ScreenRatio;
    scrn.style.width = ScreenWidth*ScreenRatio;
    scrn.style.height = ScreenHeight*ScreenRatio;

    sctx.fillStyle = "#30c0df";
    sctx.scale(ScreenRatio, ScreenRatio);
    sctx.fillRect(0, 0, ScreenWidth, ScreenHeight);
    bg.draw();
    pipe.draw();

    bird.draw();
    gnd.draw();
    UI.draw();
}

async function set_score(score) {
    let response = fetch("https://culture.argos.or.kr/set_score", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: UI.user_name,
            score: score,
            unit: "초",
            gameId: 1,
        }),
    });
    result = await response.json();
    return result;
}

async function get_score(score) {
    let user_name = prompt('이름을 입력하세요', '이름');

    let response = fetch("https://culture.argos.or.kr/get_score", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            gameId: 1,
        }),
    });
    result = await response.json();
    return result;
}
