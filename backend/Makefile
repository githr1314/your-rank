.PHONY: build run dev clean

# 构建（CGO_ENABLED=0 + 自动 ad-hoc 签名，解决 macOS LC_UUID 拒绝执行问题）
build:
	CGO_ENABLED=0 go build -o server ./cmd/server
	codesign --sign - --force server

# 构建并启动
run: build
	./server

# 开发模式（go run 不生成中间二进制，无签名问题）
dev:
	go run ./cmd/server

# 清理
clean:
	rm -f server
