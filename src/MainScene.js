class Main extends Phaser.Scene {
    constructor() {
        super('Main');
    }

    init() {
        // Initialize scene
    }

    preload() {
        const assets = [
            ['image', 'bg_kamar', 'assets/Image/bg_kamar.jpg'],
            ['image', 'bg_jam', 'assets/Image/bg_jam.png'],
            ['image', 'jam_dinding', 'assets/Image/jam_dinding.png'],
            ['image', 'misi_seru', 'assets/Image/misi_seru.png'],
            ['image', 'ui_misi', 'assets/Image/ui_misi.png'],
            ['image', 'misi_u', 'assets/Image/misi_u.png'],
            ['image', 'i_misi', 'assets/Image/i_misi.png'],
            ['image', 'kunci_bg', 'assets/Image/kunci_bg.png'],
            ['image', 'bg_putih1', 'assets/Image/bg_putih1.jpg'],
            ['image', 'jarum_jam', 'assets/Image/jarum_jam.png'],
            ['image', 'jarum_menit', 'assets/Image/jarum_menit.png'],
            ['image', 'jam_digital', 'assets/Image/jam_digital.png'],
            ['image', 'tombol_tambah_jam', 'assets/Image/tombol_tambah_jam.png'],
            ['image', 'tombol_kurang_jam', 'assets/Image/tombol_kurang_jam.png'],
            ['image', 'tombol_tambah_menit', 'assets/Image/tombol_tambah_menit.png'],
            ['image', 'tombol_kurang_menit', 'assets/Image/tombol_kurang_menit.png'],
            ['audio', 'suara_jarum_menit', 'assets/Sound/suara_jarum_menit.mp3'],
            ['audio', 'suara_benar', 'assets/Sound/suara_benar.mp3'],
            ['audio', 'suara_salah', 'assets/Sound/suara_salah.mp3'],
            ['audio', 'click_digital', 'assets/Sound/click_digital.mp3'],
            ['audio', 'sfx_selamat_digital', 'assets/Sound/sfx_selamat_digital.mp3'],
            ['audio', 'sfx_benar_digital', 'assets/Sound/sfx_benar_digital.mp3'],
            ['audio', 'sfx_salah_digital', 'assets/Sound/sfx_salah_digital.mp3'],
        ];

        assets.forEach(([type, key, path]) => this.load[type](key, path));
    }

    create() {
        this.initConstants();
        this.initState();
        this.createBackground();
        this.createClockAnalog();
        this.setupAnalogInteraction();
        this.setupMissions();
        this.createIndicators();
        this.initDigitalClock();
        this.setupDigitalClock(); // hide digital
    }

    initConstants() {
        this.X_POSITION = {
            LEFT: 0,
            CENTER: this.game.canvas.width / 2,
            RIGHT: this.game.canvas.width,
        };
        this.Y_POSITION = {
            TOP: 0,
            CENTER: this.game.canvas.height / 2,
            BOTTOM: this.game.canvas.height,
        };
    }

    initState() {
        this.totalRotasiMenit = 0;
        this.jawabanBenar = 0;
        this.jawabanSalah = 0;
        this.maxKesalahan = 3;
        this.isDragging = false;
        // reset untuk digital
        this.jamDigital = 0;
        this.menitDigital = 0;
        this.misiDigitalIndex = 0;
    }

    createBackground() {
        const X = this.X_POSITION, Y = this.Y_POSITION;
        const bgElements = [
            ['bgPutih', X.CENTER, Y.CENTER, 'bg_kamar'],
            ['bgJam', X.CENTER, Y.CENTER - 100, 'bg_jam', 0.52],
            ['jamDinding', X.CENTER, Y.CENTER - 75, 'jam_dinding', 0.15, 1],
            ['TandaSeru', X.CENTER - 442, Y.CENTER + 242, 'misi_seru', 0.055, 1.1],
            ['UiMisi', X.CENTER - 335, Y.CENTER + 238, 'ui_misi', 0.5, 1],
            ['MisiU', X.CENTER + 325, Y.CENTER + 238, 'misi_u', 0.5, 1],
            ['IMisi', X.CENTER, Y.CENTER + 238, 'i_misi', 0.5, 1, 1500, 170],
            ['KunciJawabanbg', X.CENTER + 333, Y.CENTER + 222.5, 'kunci_bg', 0.32, 1]
        ];
        bgElements.forEach(([name, x, y, key, scale = 1, depth = 0, w, h]) => {
            let img = this.add.image(x, y, key).setScale(scale).setDepth(depth);
            if (w && h) img.setDisplaySize(w, h);
            this[name] = img;
        });
        this.tweens.add({
            targets: [this.UiMisi, this.MisiU, this.IMisi],
            x: '+=0.5', duration: 500, ease: 'Bounce'
        });
    }

    createClockAnalog() {
        const X = this.X_POSITION, Y = this.Y_POSITION;
        this.jarumJam = this.add.image(X.CENTER, Y.CENTER - 75, 'jarum_jam')
            .setDisplaySize(100, 100).setOrigin(0.5, 1).setDepth(2);
        this.jarumMenit = this.add.image(X.CENTER, Y.CENTER - 75, 'jarum_menit')
            .setOrigin(0.51, 0.95).setScale(0.155).setDepth(3);
        this.jarumJam.angle = this.jarumMenit.angle = 0;
        this.clockSound = this.sound.add('suara_jarum_menit');
        this.correctSound = this.sound.add('suara_benar');
        this.wrongSound = this.sound.add('suara_salah');
    }

    setupAnalogInteraction() {
        const X = this.X_POSITION, Y = this.Y_POSITION;
        this.jarumMenit.setInteractive({ useHandCursor: true });
        this.input.setDraggable(this.jarumMenit);
        this.jarumMenit.on("pointerdown", () => {
            this.isDragging = true;
            this.clockSound.play({ loop: true, volume: 15 });
        });
        this.input.on("pointerup", () => {
            this.isDragging = false;
            this.clockSound.stop();
        });
        this.input.on('drag', (pointer, go, dragX, dragY) => {
            if (go === this.jarumMenit) {
                let angle = Phaser.Math.RadToDeg(
                    Phaser.Math.Angle.Between(X.CENTER, Y.CENTER, dragX, dragY)
                ) + 90;
                if (angle < 0) angle += 360;
                angle = Math.round(angle / 6) * 6;
                let delta = angle - this.jarumMenit.angle;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                this.totalRotasiMenit += delta;
                this.jarumMenit.angle = angle;
                this.jarumJam.angle = (this.totalRotasiMenit / 12) % 360;
            }
        });
    }

    setupMissions() {
        const X = this.X_POSITION, Y = this.Y_POSITION;
        this.misiList = [
            { text: "Atur jam ke pukul 03:00", targetMenit: 0, targetJam: 90 },
            { text: "Atur jam ke pukul 06:30", targetMenit: 180, targetJam: 195 },
            { text: "Atur jam ke pukul 09:00", targetMenit: 0, targetJam: 270 },
            { text: "Atur jam ke pukul 01:00", targetMenit: 0, targetJam: 30 }
        ];
        this.shuffleArray(this.misiList);
        this.misiList = this.misiList.slice(0, 3);
        this.misiIndex = 0;
        this.teksMisi = this.add.text(X.CENTER - 237, Y.CENTER + 242,
            this.misiList[0].text,
            { fontSize: "24px", color: "#000", fontStyle: "bold" }
        ).setOrigin(0.5).setDepth(10);
        this.btnKunciJawaban = this.add.text(X.CENTER + 360, Y.CENTER + 242,
            "Kunci Jawaban?",
            { fontSize: "24px", color: "#000", fontStyle: "bold", padding: { x: 9, y: 14 } }
        ).setOrigin(0.5).setDepth(10).setInteractive();
        this.btnKunciJawaban.on("pointerdown", () => this.periksaJawabanAnalog());
    }

    periksaJawabanAnalog() {
        const m = this.misiList[this.misiIndex];
        let totalMenit = (this.totalRotasiMenit / 6) % 720;
        if (totalMenit < 0) totalMenit += 720;
        let menit = totalMenit % 60;
        let jam = Math.floor(totalMenit / 60);
        let sudutMenit = menit * 6;
        let sudutJam = (jam % 12) * 30 + (menit / 60) * 30;
        const tol = 5;

        if (Math.abs(sudutMenit - m.targetMenit) <= tol &&
            Math.abs(sudutJam - m.targetJam) <= tol) {
            this.correctSound.play();
            this.indikatorList[this.misiIndex].setFillStyle(0x00FF00);
            this.jawabanBenar++;
            this.misiIndex++;
            if (this.jawabanBenar >= 3) {
                this.showDigitalClock();
            } else {
                this.teksMisi.setText(this.misiList[this.misiIndex].text);
                this.jarumJam.angle = this.jarumMenit.angle = 0;
                this.totalRotasiMenit = 0;
            }
        } else {
            this.wrongSound.play();
            this.indikatorList[this.misiIndex].setFillStyle(0xFF0000);
            this.jawabanSalah++;
        }
    }

    createIndicators() {
        const X = this.X_POSITION, Y = this.Y_POSITION;
        this.indikatorList = [];
        for (let i = 0; i < 3; i++) {
            this.indikatorList.push(
                this.add.circle(X.CENTER - 100 + i * 100, Y.TOP + 565, 12, 0x808080)
                    .setDepth(10)
            );
        }
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    initDigitalClock() {
        const X = this.X_POSITION, Y = this.Y_POSITION;
        const textStyle = { fontStyle: "bold", color: "#000" };

        this.jamDigitalImage = this.add.image(X.CENTER, Y.CENTER, 'jam_digital')
            .setOrigin(0.5).setScale(1.5).setDepth(1).setVisible(false);
        this.teksJamDigital = this.add.text(X.CENTER + 20, Y.CENTER + 20, "00:00", {
            ...textStyle, fontSize: "50px"
        }).setOrigin(0.5).setDepth(2).setVisible(false);

        this.teksMisiDigital = this.add.text(X.CENTER - 222, Y.CENTER + 242, "", {
            fontSize: "24px", color: "#000", fontStyle: "bold"
        }).setOrigin(0.5).setDepth(99).setVisible(false);

        this.btnKunciJawabanDigital = this.add.text(X.CENTER + 360, Y.CENTER + 242,
            "Kunci Jawaban", { fontSize: "24px", color: "#000", fontStyle: "bold", padding: { x: 9, y: 14 } }
        ).setOrigin(0.5).setDepth(100).setInteractive().setVisible(false);
        this.btnKunciJawabanDigital.on("pointerdown", () => this.periksaJawabanDigital());

        const tombolConfig = [
            { key: 'tombol_tambah_jam', x: X.CENTER - 100, y: Y.CENTER - 135, angle: 180, prop: 'btnTambahJam' },
            { key: 'tombol_kurang_jam', x: X.CENTER - 100, y: Y.CENTER + 135, angle: 0, prop: 'btnKurangJam' },
            { key: 'tombol_tambah_menit', x: X.CENTER + 100, y: Y.CENTER - 135, angle: 180, prop: 'btnTambahMenit' },
            { key: 'tombol_kurang_menit', x: X.CENTER + 100, y: Y.CENTER + 135, angle: 0, prop: 'btnKurangMenit' }
        ];
        tombolConfig.forEach(cfg => {
            this[cfg.prop] = this.add.image(cfg.x, cfg.y, cfg.key)
                .setOrigin(0.5).setScale(0.2).setAngle(cfg.angle)
                .setDepth(2).setInteractive().setVisible(false);
        });
        this.soundClick = this.sound.add("click_digital").setVolume(15);

        this.updateJamDigital = () => {
            const js = String(this.jamDigital).padStart(2, "0");
            const ms = String(this.menitDigital).padStart(2, "0");
            this.teksJamDigital.setText(`${js}:${ms}`);
        };

        // Attach event listeners for digital clock controls HERE
        this.btnTambahJam.on("pointerdown", () => {
            this.soundClick.play();
            this.jamDigital = (this.jamDigital + 1) % 24;
            this.updateJamDigital();
        });
        this.btnKurangJam.on("pointerdown", () => {
            this.soundClick.play();
            this.jamDigital = (this.jamDigital - 1 + 24) % 24;
            this.updateJamDigital();
        });
        this.btnTambahMenit.on("pointerdown", () => {
            this.soundClick.play();
            this.menitDigital = (this.menitDigital + 1) % 60;
            this.updateJamDigital();
        });
        this.btnKurangMenit.on("pointerdown", () => {
            this.soundClick.play();
            this.menitDigital = (this.menitDigital - 1 + 60) % 60;
            this.updateJamDigital();
        });

        // siapkan misi digital
        this.misiDigitalList = [
            { text: "Atur jam ke 03:45", targetJam: 3, targetMenit: 45 },
            { text: "Atur jam ke 15:15", targetJam: 15, targetMenit: 15 },
            { text: "Atur jam ke 06:00", targetJam: 6, targetMenit: 0 }
        ];
        this.shuffleArray(this.misiDigitalList);
        this.misiDigitalList = this.misiDigitalList.slice(0, 3);
        // teks misi akan di-set saat showDigitalClock()
    }

    setupDigitalClock() {
        // sembunyikan semua elemen digital (termasuk indikator bila sudah terbuat)
        this.jamDigitalImage.setVisible(false);
        this.teksJamDigital.setVisible(false);
        this.btnTambahJam.setVisible(false);
        this.btnKurangJam.setVisible(false);
        this.btnTambahMenit.setVisible(false);
        this.btnKurangMenit.setVisible(false);
        this.btnKunciJawabanDigital.setVisible(false);
        this.teksMisiDigital.setVisible(false);
        if (this.indikatorDigitalList) {
            this.indikatorDigitalList.forEach(c => c.setVisible(false));
        }
    }

    showDigitalClock() {
        // matikan analog
        this.jarumJam.setVisible(false);
        this.jarumMenit.setVisible(false);
        this.jamDinding.setVisible(false);
        this.bgJam.setVisible(false);
        this.teksMisi.setVisible(false);
        this.btnKunciJawaban.setVisible(false);
        this.indikatorList.forEach(c => c.setVisible(false)); // Hide analog indicators

        // tampilkan digital
        this.jamDigitalImage.setVisible(true);
        this.teksJamDigital.setVisible(true);
        this.btnTambahJam.setVisible(true);
        this.btnKurangJam.setVisible(true);
        this.btnTambahMenit.setVisible(true);
        this.btnKurangMenit.setVisible(true);
        this.btnKunciJawabanDigital.setVisible(true);

        // interaktif & update teks (setInteractive is already called in initDigitalClock, but it doesn't hurt to call again)
        ['btnTambahJam', 'btnKurangJam', 'btnTambahMenit', 'btnKurangMenit', 'btnKunciJawabanDigital']
            .forEach(prop => this[prop].setInteractive());
        this.updateJamDigital();

        // set dan tampilkan teks misi
        this.teksMisiDigital.setText(this.misiDigitalList[this.misiDigitalIndex].text);
        this.teksMisiDigital.setVisible(true);

        // buat indikator digital baru & tampilkan
        this.createIndicatorsDigital();
    }

    periksaJawabanDigital() {
        console.log(" MEMEMEMEMMEE");
        const m = this.misiDigitalList[this.misiDigitalIndex];
        const benar = (this.jamDigital === m.targetJam && this.menitDigital === m.targetMenit);
        if (benar) {
            this.sound.play("sfx_benar_digital");
            this.indikatorDigitalList[this.misiDigitalIndex].setFillStyle(0x00FF00);
        } else {
            this.sound.play("sfx_salah_digital");
            this.indikatorDigitalList[this.misiDigitalIndex].setFillStyle(0xFF0000);
        }
        this.misiDigitalIndex++;
        if (this.misiDigitalIndex >= this.misiDigitalList.length) {
            this.teksMisiDigital.setText("Semua misi selesai!");
            this.btnKunciJawabanDigital.disableInteractive();
            // this.tampilkanPanelSkor();
        } else {
            this.teksMisiDigital.setText(this.misiDigitalList[this.misiDigitalIndex].text);
        }
        // Reset digital clock after checking answer for the next mission (optional, but good for gameplay flow)
        this.jamDigital = 0;
        this.menitDigital = 0;
        this.updateJamDigital();
    }

    createIndicatorsDigital() {
        const X = this.X_POSITION, Y = this.Y_POSITION;
        // hapus indikator lama
        if (this.indikatorDigitalList) {
            this.indikatorDigitalList.forEach(c => c.destroy());
        }
        this.indikatorDigitalList = [];
        for (let i = 0; i < this.misiDigitalList.length; i++) {
            this.indikatorDigitalList.push(
                this.add.circle(X.CENTER - 100 + i * 100, Y.TOP + 565, 12, 0x808080)
                    .setDepth(99)
            );
        }
    }
}

window.Main = Main;