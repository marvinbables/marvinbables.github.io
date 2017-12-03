window.onload = function() {
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameHere', { preload: preload, create: create, update: update });

        function preload() {

            game.load.image('ground', 'assets/platform.png');
            game.load.image('star', 'assets/star.png');
            game.load.spritesheet('dude', 'assets/dude.png', 32, 48);

            game.load.image('background', 'assets/background.png');
            game.load.image('player', 'assets/player.png');
            game.load.image('gift', 'assets/gift.png');
            game.load.image('gift-icon', 'assets/gift-icon.png');
            game.load.image('grinch', 'assets/grinch.png');

            game.load.image('gameover', 'assets/gameover.png');
            
        }

        var player, playerSpeed = 450;
        var platforms;
        var cursors, space, wasd;
        var maxGameTime = 30000;
        var gameTimer, gameTime = maxGameTime, gameTimeText;
        var gifts, grinches;
        var score = 0, scoreText, collectedText;
        var giftExpirationTime = 1750, grinchExpirationTime = 2000;
        var gameoverMsg = null, gameover = false;
        var spawnGiftTimer = null, spawnGrinchTimer = null;
        var grounded = false;

        function create() {

            game.physics.startSystem(Phaser.Physics.ARCADE);

            game.add.sprite(0, 0, 'background');

            platforms = game.add.group();
            platforms.enableBody = true;

            var ground = platforms.create(0, game.world.height - 64, 'ground');
            ground.scale.setTo(2, 2);
            ground.body.immovable = true;

            gifts = game.add.group();
            gifts.enableBody = true;

            grinches = game.add.group();
            grinches.enableBody = true;

            player = game.add.sprite(32, game.world.height - 150, 'player');
            player.x = game.world.width / 2;
            player.y = game.world.height - 70;
            game.physics.arcade.enable(player);

            game.add.sprite(20, 20, 'gift-icon');

            player.body.bounce.y = 0.2;
            player.body.gravity.y = 1000;
            player.body.collideWorldBounds = true;
            player.anchor.setTo(.5, 1);

            cursors = game.input.keyboard.createCursorKeys();
            wasd = {
                up: game.input.keyboard.addKey(Phaser.Keyboard.W),
                down: game.input.keyboard.addKey(Phaser.Keyboard.S),
                left: game.input.keyboard.addKey(Phaser.Keyboard.A),
                right: game.input.keyboard.addKey(Phaser.Keyboard.D)
            }

            space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

            gameTimeText = game.add.text(game.world.width - 100, 16, getTextTime(), { fontSize: '32px', fill: '#000' });
            scoreText = game.add.text(60, 16, '0', { fontSize: '32px', fill: '#000' });

            init();
        }

        function spawnGift() {
            var gift = gifts.create(game.rnd.integerInRange(50, 740), -80, 'gift');
            game.physics.arcade.enable(gift);
            gift.body.gravity.y = 500;
            spawnGiftTimer = game.time.events.add(game.rnd.integerInRange(400, 650), spawnGift, this);
        }

        function spawnGrinch() {
            var grinch = grinches.create(game.rnd.integerInRange(50, 740), -120, 'grinch');
            game.physics.arcade.enable(grinch);
            grinch.body.gravity.y = 1200;
            spawnGrinchTimer = game.time.events.add(game.rnd.integerInRange(4000, 6000), spawnGrinch, this);
        }

        function updateTime() {
            gameTime -= 1000;
            if(gameTime == 0) {
                gameoverMsg = game.add.sprite(400, 300, 'gameover');
                gameoverMsg.inputEnabled = true;
                gameoverMsg.x = game.world.width / 2 - gameoverMsg.width / 2;
                gameoverMsg.y = game.world.height / 2 - gameoverMsg.height / 2;
                game.time.events.remove(spawnGiftTimer);
                game.time.events.remove(spawnGrinchTimer);
                collectedText = game.add.text(gameoverMsg.x + gameoverMsg.width / 2, gameoverMsg.y + gameoverMsg.height / 2 + 50, "Gifts collected: " + score, { fontSize: '32px', fill: '#000' });
                collectedText.anchor.set(0.5);
                gameover = true;
            }
            if(gameTime >= 0) {
                gameTimeText.text = getTextTime();
            }
        }

        function init() {
            gameover = false;
            if(gameoverMsg != null) {
                gameoverMsg.kill();
                gameoverMsg = null;
            }
            grinches.callAll('kill');
            gifts.callAll('kill');
            score = 0;
            scoreText.text = "0";
            gameTime = maxGameTime;
            gameTimeText.text = getTextTime();

            game.time.events.remove(spawnGiftTimer);
            game.time.events.remove(spawnGrinchTimer);
            spawnGiftTimer = game.time.events.add(1000, spawnGift, this);
            spawnGrinchTimer = game.time.events.add(5000, spawnGrinch, this);

            if(collectedText != null) {
                collectedText.kill();
            }

            if(gameTimer != null) {
                gameTimer.destroy();
            }
            gameTimer = game.time.create(false);
            gameTimer.loop(1000, updateTime, this);
            gameTimer.start();
        }

        function getTextTime() {
            var second = (gameTime / 1000) % 60;
            var minute = (gameTime / 1000) / 60;
            var text = parseInt(minute) + ":" + ((second < 10)? "0" + second : second);
            return text;
        }

        function update() {
            grounded = false;
            game.physics.arcade.collide(player, platforms, setGrounded);
            game.physics.arcade.collide(gifts, platforms, startExpireGift);
            game.physics.arcade.collide(grinches, platforms, startExpireGrinch);
            if(!gameover) {
                game.physics.arcade.overlap(player, gifts, collectGift, null, this);
                game.physics.arcade.overlap(player, grinches, collectGrinch, null, this);
            }

            player.body.velocity.x = 0;
            if(!gameover) {
                if (cursors.left.isDown || wasd.left.isDown) {
                    player.body.velocity.x = -playerSpeed;
                    player.scale.setTo(-1, 1);
                }
                else if (cursors.right.isDown || wasd.right.isDown) {
                    player.body.velocity.x = playerSpeed;
                    player.scale.setTo(1, 1);
                }

                if ((space.isDown || cursors.up.isDown) && player.body.touching.down && grounded) {
                    player.body.velocity.y = -500;
                }
            }

            if(gameover) {
                if(game.input.activePointer.leftButton.isDown) {
                    init();
                }
            }
        }

        function setGrounded() {
            grounded = true;
        }

        function startExpireGift(gift, platform) {
            game.time.events.add(giftExpirationTime, expireGift, this, gift);
        }

        function expireGift(gift) {
            gift.kill();
        }

        function startExpireGrinch(grinch, platform) {
            game.time.events.add(grinchExpirationTime, expireGrinch, this, grinch);
        }

        function expireGrinch(grinch) {
            grinch.kill();
        }

        function collectGift(player, gift) {
            gift.kill();
            score += 1;
            scoreText.text = score + "";
        }

        function collectGrinch(player, grinch) {
            grinch.kill();
            score -= 10;
            scoreText.text = score + "";
        }
};