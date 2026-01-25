Component({
    properties: {
        width: { type: Number, value: 300 },
        height: { type: Number, value: 150 },
        lineColor: { type: String, value: '#000000' },
        lineWidth: { type: Number, value: 4 }
    },

    data: {
        isEmpty: true
    },

    lifetimes: {
        ready() {
            this.initCanvas();
        }
    },

    methods: {
        initCanvas() {
            const query = this.createSelectorQuery();
            query.select('#signature-canvas')
                .fields({ node: true, size: true })
                .exec((res) => {
                    const canvas = res[0].node;
                    const ctx = canvas.getContext('2d');
                    const dpr = wx.getSystemInfoSync().pixelRatio;

                    // Handle resizing for high DPI
                    canvas.width = res[0].width * dpr;
                    canvas.height = res[0].height * dpr;
                    ctx.scale(dpr, dpr);

                    // Component instance vars (non-reactive)
                    this.canvas = canvas;
                    this.ctx = ctx;
                    this.dpr = dpr;
                    this.points = []; // Track points for smooth curves

                    this.ctx.lineCap = 'round';
                    this.ctx.lineJoin = 'round';
                });
        },

        onTouchStart(e: any) {
            const touch = e.touches[0];
            const { x, y } = touch;

            this.points = [{ x, y }];
            this.ctx.beginPath();
            this.ctx.lineWidth = this.data.lineWidth;
            this.ctx.strokeStyle = this.data.lineColor;
            this.ctx.moveTo(x, y); // Start point

            this.setData({ isEmpty: false });
        },

        onTouchMove(e: any) {
            const touch = e.touches[0];
            const { x, y } = touch;
            const points = this.points;

            points.push({ x, y });

            // Optimized quadratic curve drawing for smoother lines
            if (points.length >= 3) {
                const lastTwo = points.slice(-2);
                const controlPoint = lastTwo[0];
                const endPoint = {
                    x: (lastTwo[0].x + lastTwo[1].x) / 2,
                    y: (lastTwo[0].y + lastTwo[1].y) / 2,
                };

                this.ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
                this.ctx.stroke();
            }
        },

        onTouchEnd() {
            // Finish any remaining path
            const points = this.points;
            if (points.length > 0) {
                const last = points[points.length - 1];
                this.ctx.lineTo(last.x, last.y);
                this.ctx.stroke();
            }
        },

        clear() {
            if (!this.ctx) return;
            const { width, height } = this.data;
            this.ctx.clearRect(0, 0, width, height); // Clear using logical size (scaled automatically)
            this.setData({ isEmpty: true });
        },

        async export() {
            if (this.data.isEmpty) {
                return null;
            }

            return new Promise((resolve, reject) => {
                wx.canvasToTempFilePath({
                    canvas: this.canvas, // Pass canvas instance for 2d type
                    success: (res) => resolve(res.tempFilePath),
                    fail: (err) => reject(err)
                });
            });
        }
    }
});
