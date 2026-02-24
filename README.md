# 6-Month Roadmap: Distributed Trust Systems Engineer

## How This Roadmap Works

**Schedule:** 2.5 hours/day Monday–Friday, 3–4 hours Saturday, Sunday rest.
**Each day has 4 lines:** Read → Build → Steps → Done.
**Rule:** If "Done" is not true, do not move to the next day. Fix it first.
**Rule:** You write and run code every day. Not documents. Code.

If you fall behind, finish the current week before starting the next.
Skip nothing. Each week uses what the previous week built.

**Your project lives in one repo:**
```bash
mkdir -p ~/trust-infra && cd ~/trust-infra && git init
```
You will grow this repo for 6 months. Every week adds to it.

---

## The Full Picture (What You Build Over 6 Months)

You are building a system called **CivicTrust** — a platform that issues signed documents,
records them in a tamper-proof log, and lets anyone verify them without trusting one server.

You don't build CivicTrust on day 1. You build it in layers:

```
Month 1: Make bytes move between machines reliably
Month 2: Make messages trustworthy (can't be faked or replayed)
Month 3: Make data survive crashes and machine failures
Month 4: Make data publicly verifiable (anyone can check, no one can cheat)
Month 5: Compose all layers into CivicTrust
Month 6: Prove it works, package it, prepare for jobs
```

Each month needs the one before it. That is why the order matters.

---

## Month-by-Month Goals

| Month | Goal | What exists at the end |
|-------|------|----------------------|
| 1 | Send data between programs over the network | Multi-client TCP server with logging |
| 2 | Prove messages are real and not tampered | Signed protocol with replay defense |
| 3 | Survive crashes and machine failures | Replicated key-value store with leader election |
| 4 | Prove data was not changed, publicly | Transparency log with Merkle proofs |
| 5 | Compose into CivicTrust | Document issuance + anchoring + offline verification |
| 6 | Make it job-ready | Threat model + SLOs + demo + interview prep |

---

## Week-by-Week Goals

| Week | Title | What you can do after |
|------|-------|----------------------|
| 1 | Structured Logger | Write and read structured log files safely |
| 2 | TCP Server Basics | Accept network connections, echo bytes back |
| 3 | Framing + Multi-Client | Handle many clients at once with proper message boundaries |
| 4 | Hardening + Month 1 Demo | Survive bad clients, prove Month 1 works |
| 5 | Thread Pool | Do CPU work in parallel without data corruption |
| 6 | Hashing + Integrity | Detect if data was changed |
| 7 | Signatures + Identity | Prove who sent a message |
| 8 | Replay Defense + Month 2 Demo | Reject fake and repeated messages |
| 9 | Key-Value Store + WAL | Store data that survives crashes |
| 10 | Crash Recovery | Restart after failure without data loss |
| 11 | Replication | Copy data across multiple machines |
| 12 | Leader Election + Month 3 Demo | Pick new leader when old one dies, no data lost |
| 13 | Content-Addressed Storage | Store files by their hash (tamper-visible) |
| 14 | Merkle Trees | Prove one item is in a large set efficiently |
| 15 | Transparency Log | Append-only record with signed checkpoints |
| 16 | Monitors + Month 4 Demo | Independent watchers that catch cheating |
| 17 | Document Issuance | Issue signed documents with policy rules |
| 18 | Transparency Anchoring | Record documents in the transparency log |
| 19 | Offline Verification | Verify documents with no internet |
| 20 | Chaos Testing + Month 5 Demo | Break everything on purpose, prove it recovers |
| 21 | Observability + SLOs | Define and measure "healthy system" |
| 22 | Security + Threat Modeling | Map every attack, test defenses |
| 23 | Documentation + Portfolio | Make your work visible and presentable |
| 24 | Interview Prep + Final Demo | Explain, debug, and present under pressure |

---

# Month 1: Networking Foundations

**Goal:** Build a TCP server that handles many clients, frames messages correctly,
logs everything, and survives bad inputs.

**What you learn:** TCP is a stream of bytes, not a stream of messages.
Your job is to turn raw bytes into safe, structured communication.

**What you need after Month 1:** A multi-client server with logging that
your Month 2 code will add cryptographic trust to.

---

## Week 1: Structured Logger Library

**Goal:** Build a C++ library that writes and reads structured log entries to a file.
This library will be used by every other component you build for 6 months.

**By Saturday:** A working `logger.h` that any program can include and use,
with tests that pass the same way every time.

### Setup (do once before Monday)

```bash
cd ~/trust-infra
mkdir -p src tests include week-1
```

Create `CMakeLists.txt`:
```cmake
cmake_minimum_required(VERSION 3.20)
project(trust-infra LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
enable_testing()

add_library(trustlog src/logger.cpp)
target_include_directories(trustlog PUBLIC include)

add_executable(trustlog_cli src/main.cpp)
target_link_libraries(trustlog_cli trustlog)

add_executable(test_logger tests/test_logger.cpp)
target_link_libraries(test_logger trustlog)
add_test(NAME logger_tests COMMAND test_logger)
```

Create `.github/workflows/build.yml` for CI:
```yaml
name: Build & Test
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cmake -B build && cmake --build build
      - run: cd build && ctest --output-on-failure
```

Push to GitHub. From now on, every commit is tested automatically.

### Monday — Build a Working Logger

**Read** (20 min): If you know C but not C++ classes, read this table:

| C habit | C++ replacement | Why |
|---------|----------------|-----|
| `char*` + `strlen` | `std::string` | No manual memory management |
| `FILE*` + `fclose` | `std::ofstream` — closes automatically when destroyed | No leaked file handles |
| `#define ERROR 3` | `enum class ErrorCode { ... }` | Type-safe, can't mix up numbers |
| `malloc`/`free` | Constructors/destructors (RAII) | Memory freed automatically |

**Build** (90 min): Create `include/logger.h` and `src/logger.cpp`.

1. Define `LogEntry` struct: `timestamp` (uint64, milliseconds), `level` (INFO/WARN/ERROR), `component` (string, max 32 chars), `message` (string, max 1024 chars)
2. Create `Logger` class: constructor takes file path, opens file for appending
3. Add `append()` method: writes one log entry as a tab-separated line to the file
4. Destructor closes the file (this is RAII — the C++ way to avoid forgetting `fclose`)
5. Create `src/main.cpp`: parse command line args, call `logger.append()`
6. Usage: `./trustlog_cli append --file log.txt --level INFO --component test --message "hello"`

**Test** (20 min): Write `tests/test_logger.cpp` with 3 tests:
- Append one entry, read file back, verify line is correct
- Append 3 entries, verify file has 3 lines
- Open logger, destroy it, verify file is closed (no crash)

**Done when:** `cmake -B build && cmake --build build && cd build && ctest` passes.
You can run `./trustlog_cli append` and see a line in the log file.

```bash
git add -A && git commit -m "day1: basic logger + CLI"
```

### Tuesday — Read Back + Filter + File Errors

**Read** (15 min): `man 2 fsync` — understand: writing to a file does NOT mean it's
on disk. The OS can hold it in memory. `fsync` forces it to disk. This matters for crash safety.

**Build** (100 min):
1. Add `read` command: reads log file, prints all entries
2. Add filters: `--level ERROR` shows only errors, `--component net` shows only "net" entries
3. Handle file errors: file not found → print error to stderr, exit code 2
4. Handle malformed lines: skip them, print warning to stderr, keep reading
5. Add `FsyncPolicy` option to Logger: `NONE` (fast) or `EVERY_WRITE` (safe). When `EVERY_WRITE`, call `fsync()` after each append. (Use the POSIX file descriptor — you know this from C.)

**Test** (15 min): Add tests:
- Write 5 entries with mixed levels → filter by ERROR → only ERROR entries returned
- Open nonexistent file for reading → exit code 2, error message on stderr
- File with one garbage line among good lines → garbage skipped, good lines returned

**Done when:** All tests pass. `./trustlog_cli read --file log.txt --level ERROR` works correctly.

```bash
git commit -am "day2: read + filter + fsync + file error handling"
```

### Wednesday — Input Validation

**Read** (15 min): Think about this: your logger will be used inside a TCP server.
Network data is untrusted. If someone sends a 10 MB string as "component", your logger
should not write 10 MB to disk. Validation must happen BEFORE any file write.

**Build** (90 min):
1. Reject empty component → return error code, don't write
2. Reject component > 32 bytes → return error code
3. Reject message > 1024 bytes → return error code
4. Reject message containing tab or newline → return error code (would break your format)
5. All validation happens before touching the file

Define exit codes for the CLI:

| Situation | Exit code |
|-----------|-----------|
| Success | 0 |
| Invalid arguments | 1 |
| File error | 2 |

**Test** (15 min): Boundary tests:
- 0-byte message → rejected
- Exactly 1024-byte message → accepted
- 1025-byte message → rejected
- Message with tab character → rejected

**Done when:** All boundary tests pass. Invalid input never reaches the file.

```bash
git commit -am "day3: input validation + boundary limits"
```

### Thursday — Error Codes + Request IDs

**Read** (15 min): When you have 3 servers running, and a user reports a bug, how do you
find the log entries for that one request across all 3 servers? Answer: every log entry
for that request has the same `request_id`. This is called **correlation**.

**Build** (90 min):
1. Add `request_id` field to `LogEntry` (string, max 64 chars, optional)
2. Create `generate_request_id()` function: returns something like `req-1700000123-a3f2` using `<random>` (NOT `rand()` — C++ has proper random number generators)
3. CLI auto-generates request_id if not provided: `./trustlog_cli append --file log.txt --level INFO --component net --message "connected"` → request_id is auto-filled
4. CLI accepts explicit request_id: `--request-id req-abc-123`
5. Add `--request-id` filter to read command
6. Define error code enum with specific numbers for each error type (invalid args = 1001, file not found = 2001, etc.)
7. All errors print to stderr. All data prints to stdout. Never mix them.

**Test** (20 min):
- Generate 100 request IDs → all unique
- Search by request_id → only matching entries returned
- Each error code produces correct stderr message

**Done when:** You can trace related log entries by request_id. Errors are specific and machine-readable.

```bash
git commit -am "day4: error codes + request ID correlation"
```

### Friday — Deterministic Tests

**Read** (15 min): Your tests currently use real timestamps, so output is different every run.
Fix: instead of calling the real clock, let the caller provide a clock function.
In production → real clock. In tests → fake clock that returns fixed numbers.
This is called **dependency injection**. It makes tests repeatable.

**Build** (80 min):
1. Define clock type: `using ClockFn = std::function<uint64_t()>;` (this is like a function pointer in C, but safer)
2. Change Logger constructor to accept optional clock: `Logger(path, fsync_policy, clock_fn)`
3. Default clock uses `std::chrono::system_clock::now()`
4. In tests, pass fake clock: `auto fake_clock = [&]() { return fake_time++; };`
5. Create golden file test: write entries with fake clock → expected output is identical every time
6. Create `tests/golden/basic_append.expected` with exact expected output
7. Test compares actual output byte-by-byte with golden file

**Test** (30 min): Run all tests twice. Output must be identical both times. If any test
gives different results on different runs, fix it.

**Done when:** `ctest` passes, and running it 10 times gives same result every time.

```bash
git commit -am "day5: clock injection + deterministic golden file tests"
```

### Saturday — Clean Up + Benchmark + README

**Build** (3.5 hours):

**Part 1 — Module boundary (1h):**
1. Clean up file structure: `include/logger.h`, `include/errors.h`, `include/request_id.h`, `include/clock.h`
2. Make sure `logger.h` does NOT depend on CLI code
3. Verify: write a 10-line program that includes `logger.h` and uses the logger. It must compile without any CLI code. This proves your logger is a reusable library.

**Part 2 — Benchmark (1h):**
1. Write `tests/bench_logger.cpp`
2. Measure: append 10,000 entries with `FsyncPolicy::NONE` → time in milliseconds
3. Measure: append 1,000 entries with `FsyncPolicy::EVERY_WRITE` → time in milliseconds
4. Measure: read 10,000 entries with no filter → time in milliseconds
5. Print results as a table. Save the numbers — you will compare against them in Week 2.

**Part 3 — README (30 min):**
Write `week-1/README.md`: what it does, how to build, how to test, benchmark numbers,
what carries forward to Week 2 (the logger library).

**Done when:** All tests pass. Logger compiles as standalone library. Benchmark numbers recorded.

```bash
git commit -am "day6: module boundary + benchmarks + README"
git tag week-1-done
```

### Week 1 Quality Gate

| Check | Pass? |
|-------|-------|
| `ctest` passes all tests | |
| Invalid input never reaches the file | |
| Errors go to stderr, data goes to stdout | |
| Tests are deterministic (same result every run) | |
| Logger compiles without CLI code | |
| Benchmark numbers recorded | |
| CI passes on GitHub | |

**Do NOT start Week 2 until every check passes.**

---

## Week 2: TCP Server Basics

**Goal:** Build a TCP server that accepts one client connection, receives bytes, and
sends them back (an "echo server"). Then build a client that connects and sends data.

**New concept — TCP is a byte stream:**
When you send "hello" over TCP, the other side might receive "hel" and then "lo" in two
separate reads. TCP does not preserve message boundaries. It just delivers bytes in order.
This is the most important networking concept you will learn this month.

**Reading for this week:**
Beej's Guide to Network Programming, sections 5-6: [https://beej.us/guide/bgnet/](https://beej.us/guide/bgnet/)
This is written in casual English, uses C code (which you already know). Best networking tutorial that exists.

### Monday — First TCP Server

**Read** (30 min): Beej's Guide sections 5.1–5.3 (socket, bind, listen, accept).

**Build** (80 min):
1. Create `src/server.cpp`: a program that listens on port 9000
2. Call `socket()`, `bind()`, `listen()` — you know these as C functions, they work the same
3. Call `accept()` — this blocks until a client connects
4. Read bytes from client with `recv()`, send them back with `send()`
5. When client disconnects, close connection and wait for next client
6. If port 9000 is already in use, print error to stderr and exit (use `SO_REUSEADDR`)
7. Add to CMakeLists.txt: `add_executable(echo_server src/server.cpp)` and link `trustlog`
8. Log every connection and disconnection using your logger from Week 1

**Test** (20 min): Open two terminals:
- Terminal 1: `./echo_server`
- Terminal 2: `echo "hello" | nc localhost 9000` — should print "hello" back

**Done when:** `echo "hello" | nc localhost 9000` returns "hello". Server logs show the connection.

```bash
git commit -am "day1: basic TCP echo server"
```

### Tuesday — Handle Partial Reads

**Read** (20 min): Beej's Guide section 7.3 (handling partial send).
Key point: `recv()` can return fewer bytes than you asked for. `send()` can send fewer
bytes than you gave it. You must loop until all bytes are handled.

**Build** (90 min):
1. Change your read loop: keep calling `recv()` until you get 0 (client disconnected) or error
2. Change your write path: if `send()` sends fewer bytes than expected, loop to send the rest
3. Create `src/client.cpp`: connects to server, sends a message, reads the echo back
4. Add client to CMakeLists.txt
5. Test with a large payload (send 100KB) — this will force partial reads/writes

**Test** (20 min):
- Send 100KB of data → receive exact same 100KB back
- Compare sent vs received with a hash (or just byte count for now)
- Kill client mid-send → server should not crash, should log the disconnection

**Done when:** 100KB echo works correctly. Server survives client disconnect.

```bash
git commit -am "day2: partial read/write handling + client"
```

### Wednesday — Length-Prefix Framing

**Read** (15 min): Since TCP is just bytes with no message boundaries, you need a way to
tell the receiver "the next message is N bytes long." The simplest way: send 4 bytes
containing the length, then send the message. This is called **length-prefix framing**.

```
[4 bytes: length][N bytes: message data]
```

**Build** (90 min):
1. Define frame format: first 4 bytes = message length (uint32, network byte order), then message bytes
2. Create `include/framing.h` with `send_frame()` and `recv_frame()` functions
3. `send_frame()`: sends 4-byte length header + message bytes
4. `recv_frame()`: reads 4-byte length, then reads exactly that many message bytes (looping for partial reads)
5. Reject frames larger than 64KB (protect against memory abuse)
6. Update server and client to use frames instead of raw bytes

**Test** (15 min):
- Send "hello" as a frame → receive "hello" as a frame
- Send empty frame (0 length) → handled correctly
- Send frame claiming to be 100MB → server rejects it, logs warning, closes connection

**Done when:** Client and server communicate in frames. Oversized frames are rejected.

```bash
git commit -am "day3: length-prefix framing"
```

### Thursday — Multi-Client with poll()

**Read** (20 min): Right now your server handles one client at a time. While talking to
client A, client B has to wait. To handle many clients, you use `poll()` (or `select()`).
These functions say: "tell me which sockets have data ready to read."

Read: `man poll` — focus on `POLLIN` and how `pollfd` array works.

**Build** (90 min):
1. Replace the single-client loop with a `poll()` loop
2. Keep an array of connected clients (start with max 64)
3. When `poll()` says the listen socket is readable → `accept()` new client
4. When `poll()` says a client socket is readable → `recv_frame()` from that client
5. Echo the frame back to that specific client
6. When client disconnects → remove from array, close socket
7. Log each event: new connection, received frame, disconnection

**Test** (20 min): Open 3 terminals, connect 3 clients simultaneously.
Each client sends a message and gets its own echo back. No mixing, no blocking.

**Done when:** 3+ clients work simultaneously. Each gets correct echo. Server logs show all connections.

```bash
git commit -am "day4: multi-client server with poll()"
```

### Friday — Timeouts + Connection Limits

**Read** (15 min): A client that connects but never sends data wastes a slot forever.
A **timeout** closes idle connections after a set time. A **connection limit** rejects
new connections when the server is full.

**Build** (90 min):
1. Track last activity time for each client
2. In the poll loop, check: if a client has been idle > 30 seconds, disconnect them
3. Set a max connection limit (e.g., 64). If a new client tries to connect when full, accept and immediately close with a message "server full"
4. Log: timeout disconnections, rejection due to full server
5. Handle `SIGINT` (Ctrl+C): close all connections cleanly, then exit

**Test** (20 min):
- Connect a client, send nothing for 35 seconds → server disconnects it, logs timeout
- Fill server to 64 clients → client 65 gets rejected
- Press Ctrl+C → server closes all connections and exits cleanly

**Done when:** Idle clients get disconnected. Full server rejects new clients cleanly.

```bash
git commit -am "day5: timeouts + connection limits + clean shutdown"
```

### Saturday — Stress Test + Month 1 Prep

**Build** (3.5 hours):

**Part 1 — Stress test (1.5h):**
1. Write a test script that spawns 50 clients, each sends 100 frames
2. Verify: all 50 clients get correct echoes, no data mixing
3. Measure: total time, average round-trip latency per frame
4. Test: kill 10 clients randomly mid-conversation → server keeps running, serves remaining 40

**Part 2 — Compare with Week 1 (1h):**
1. Measure: log entries per second when logging through the TCP server vs direct file writes (Week 1 benchmark)
2. The difference is your networking overhead. Record it.

**Part 3 — README (1h):**
Write `week-2/README.md`: what the server does, how to run it, stress test results, known limits.

**Done when:** 50-client stress test passes. Benchmarks recorded. Server survives random client deaths.

```bash
git commit -am "day6: stress test + benchmarks"
git tag week-2-done
```

---

## Week 3: Protocol Framing + Robustness

**Goal:** Make your server handle real-world problems: bad data, slow clients,
and connection churn. Add a structured protocol on top of raw frames.

### Monday — Structured Protocol Envelope

**Read** (15 min): Right now your frames carry raw bytes. A real protocol needs structure:
what type of message is this? Who sent it? When? This metadata is called an **envelope** —
like the outside of a letter that tells you who it's from and where it's going.

**Build** (90 min):
1. Define a message envelope in `include/protocol.h`:
   - `version` (uint8): protocol version, always 1 for now
   - `msg_type` (uint8): ECHO_REQUEST=1, ECHO_RESPONSE=2
   - `request_id` (string): unique ID for this request (reuse your generator from Week 1)
   - `timestamp` (uint64): when the message was created
   - `payload` (bytes): the actual data
2. Serialize envelope to bytes for sending (keep it simple: fixed header + payload)
3. Deserialize bytes back to envelope on receiving
4. Server reads envelope, checks version and msg_type, echoes with ECHO_RESPONSE type
5. Reject unknown version or message type → log warning, close connection

**Test** (20 min):
- Send valid envelope → get valid response envelope back with same request_id
- Send envelope with version=99 → server rejects and logs reason
- Send envelope with unknown msg_type → server rejects and logs reason

**Done when:** Client and server communicate using structured envelopes. Bad envelopes are rejected.

```bash
git commit -am "day1: protocol envelope"
```

### Tuesday — Malformed Input Defense

**Read** (15 min): On the internet, your server will receive garbage — either from bugs or
from attackers. Every field in your envelope could be wrong. Your server must never crash
on bad input.

**Build** (90 min):
1. Test every envelope field for validity during deserialization
2. Header too short → reject (need minimum bytes for fixed fields)
3. Payload size doesn't match frame length → reject
4. request_id longer than 64 bytes → reject
5. Timestamp is 0 or far in the future (> 1 hour ahead) → reject
6. For each rejection: log the reason, close the connection, increment a counter
7. Never allocate memory based on untrusted size without checking limits first

**Test** (20 min):
- Send frame with header too short (3 bytes instead of minimum) → rejected
- Send frame where payload size field says 1000 but only 5 bytes follow → rejected
- Send 100 bad frames rapidly → server stays alive, logs 100 rejections

**Done when:** Server survives all malformed inputs without crashing. Every rejection is logged with a reason.

```bash
git commit -am "day2: malformed input defense"
```

### Wednesday — Slow Client Defense

**Read** (15 min): A **slow client** sends data one byte per second, keeping a connection
open forever and wasting server resources. Defense: if a client doesn't finish sending a
frame within a deadline, disconnect them.

**Build** (90 min):
1. Track how long each client has been in "receiving a frame" state
2. If a client starts a frame but doesn't finish within 10 seconds → disconnect, log reason
3. Track per-client send buffer: if outbound data builds up (client isn't reading), disconnect after 64KB buffered
4. Count total bytes received/sent per client for logging
5. Log each disconnection with reason: timeout, slow, normal close, error

**Test** (20 min):
- Connect client, send 2 bytes of a frame header, then wait 15 seconds → server disconnects
- Connect client, send valid requests but never read responses → server disconnects after buffer fills
- Verify: other clients are not affected by the slow client

**Done when:** Slow clients get disconnected without affecting other clients.

```bash
git commit -am "day3: slow client defense"
```

### Thursday — Connection Churn Test

**Read** (15 min): In production, clients connect and disconnect constantly. Your server
must not leak resources (file descriptors, memory) over time. This is called **churn testing**.

**Build** (90 min):
1. Write a churn test: spawn client → send 1 frame → disconnect → repeat 1000 times
2. After 1000 cycles, check: server file descriptor count should be stable (use `ls /proc/PID/fd | wc -l`)
3. Memory usage should be stable (no growth)
4. Add a `/status` message type to your protocol: server responds with connection count, total frames served, uptime
5. Use `/status` to verify server state during tests

**Test** (20 min):
- Run 1000 connect-send-disconnect cycles
- Check: fd count after cycle 1000 ≈ fd count after cycle 10
- Check: `/status` response shows correct connection count (should be ~0 after all disconnect)

**Done when:** 1000 churn cycles with stable resource usage. No file descriptor leaks.

```bash
git commit -am "day4: churn test + status endpoint + leak check"
```

### Friday — Read Production Server Code

**Read** (2h): Today is different. You don't write much code. Instead, you read how
professionals build servers.

**Read** Redis source code — just the event loop:
- File: `src/ae.c` in the Redis repo ([GitHub](https://github.com/redis/redis))
- Focus on: `aeMain()`, `aeProcessEvents()`, `aeCreateFileEvent()`
- Notice: how they handle multiple clients, how they structure the event loop
- Compare: what did they do that you didn't? What patterns do you recognize?

**Build** (30 min):
Write `week-3/code-reading-notes.md`: 5 things you noticed in Redis event loop that
are different from or better than your implementation.

**Done when:** Notes written with 5 specific observations.

```bash
git commit -am "day5: Redis event loop code reading notes"
```

### Saturday — Integration + Month 1 Demo

**Build** (3.5 hours):

**Part 1 — Integration test (2h):**
1. Write a single test script that exercises the full system:
   - Start server
   - Connect 20 clients
   - Each sends 10 framed envelopes
   - 2 clients are "slow" (send partial data then stop)
   - 1 client sends garbage
   - Verify: 17 good clients get correct echoes, 3 bad clients are disconnected
2. Collect server logs, verify every event is logged with request_id

**Part 2 — Month 1 Demo (1.5h):**
1. Write `month-1/README.md` with: what you built, architecture diagram (text is fine), how to run, test results
2. Record benchmark table: throughput, latency, max clients tested
3. List what carries forward: logger library, framing library, protocol envelope, error patterns

**Done when:** Integration test passes. Month 1 README complete with benchmark numbers.

```bash
git commit -am "day6: month-1 integration test + demo"
git tag month-1-done
```

---

# Month 2: Cryptographic Trust

**Goal:** Make messages trustworthy. After this month, your protocol can prove:
who sent a message, that it was not changed, and that it is not a replay of an old message.

**New concept — hashing:** A hash function takes any data and produces a fixed-size
fingerprint (like SHA-256 → 32 bytes). If even one bit of the data changes, the hash
changes completely. This is how you detect tampering.

**New concept — digital signature:** Like a handwritten signature, but mathematical.
Only the person with the private key can create it. Anyone with the public key can verify it.
This is how you prove who sent a message.

**Library you will use:** libsodium — a simple, hard-to-misuse crypto library.
Install: `sudo apt install libsodium-dev`

---

## Week 4 (originally Week 5): Thread Pool + Safe Concurrency

**Goal:** Add a thread pool so your server can do CPU-heavy work (like hashing and signing)
without blocking the event loop.

**New concept — thread:** A thread is a separate flow of execution inside your program.
Two threads can run at the same time on different CPU cores. But if they both write to
the same variable, data gets corrupted. This is called a **data race**.

**New concept — mutex:** A lock that only one thread can hold at a time. While one thread
holds it, others wait. This prevents data races but slows things down if overused.

### Monday — First Thread

**Read** (30 min): C++ threads documentation — cppreference `std::thread`, `std::mutex`.
Key point: in C++ if two threads write to the same variable without a lock, it's **undefined
behavior** — your program can do anything, including appearing to work and then crashing later.

**Build** (80 min):
1. Create `src/threadpool.cpp` and `include/threadpool.h`
2. Create a simple bounded work queue: a `std::queue` protected by a `std::mutex`
3. Add `push()`: adds work to queue. If queue is full (max 100 items), return false.
4. Add `pop()`: waits for work using `std::condition_variable`, returns one item
5. Start 4 worker threads that call `pop()` in a loop and execute the work

**Test** (20 min):
- Push 10 tasks that each set a flag → all 10 flags set
- Push 200 tasks into queue with max 100 → 100 accepted, 100 rejected
- No crashes, no data corruption

**Done when:** Thread pool processes tasks from queue. Overloaded queue rejects cleanly.

```bash
git commit -am "day1: basic thread pool + bounded queue"
```

### Tuesday — Graceful Shutdown

**Read** (15 min): When your server stops, you need to: stop accepting new tasks,
finish tasks already in the queue, then shut down worker threads. If you just kill threads,
tasks are lost. This is **graceful shutdown**.

**Build** (90 min):
1. Add `shutdown()` method to thread pool
2. Shutdown sequence: set "stopping" flag → wake all sleeping workers → wait for queue to drain → join all threads
3. After shutdown, push() always returns false
4. Add timeout: if drain takes more than 5 seconds, force-stop remaining workers
5. Test with tasks that take varying times (100ms, 500ms, 2s)

**Test** (20 min):
- Push 50 tasks, call shutdown → all 50 complete, threads exit
- Push a 10-second task, shutdown with 5s timeout → force-stops after 5s

**Done when:** Clean shutdown with no task loss for normal cases, forced stop with timeout.

```bash
git commit -am "day2: graceful shutdown"
```

### Wednesday — Integrate Pool with Server

**Read** (15 min): Your event loop handles I/O (reading/writing sockets). Your thread pool
handles CPU work. The pattern: event loop receives a frame → puts it in the queue →
worker processes it → worker puts response back to the event loop for sending.

**Build** (90 min):
1. Server event loop receives frames (like before)
2. Instead of processing immediately, push work to thread pool
3. Worker processes the frame (for now, just echo processing)
4. Worker puts response into an output queue
5. Event loop checks output queue during each poll cycle, sends responses
6. Make sure: frame data is copied into the queue item, not referenced (the original buffer may be reused)

**Test** (20 min):
- 20 clients send frames simultaneously → all get correct echoes
- Verify with logs: requests and responses have matching request_ids
- Compare latency with and without thread pool (should be similar for echo — pool helps with CPU-heavy work)

**Done when:** Server uses thread pool for processing. All clients get correct responses.

```bash
git commit -am "day3: server + thread pool integration"
```

### Thursday — Contention Measurement

**Read** (15 min): How do you know if your locks are slowing things down?
Measure how long threads wait for the lock. This is **contention**.
High contention = threads spending time waiting instead of working.

**Build** (90 min):
1. Add timing around every `mutex.lock()`: record how long the wait took
2. Track: total lock-wait time, max lock-wait time, number of lock acquisitions
3. Track queue depth over time: how full does the queue get?
4. Print summary after each test: "Avg lock wait: Xμs, Max lock wait: Yμs, Peak queue depth: N"
5. Try running with 1, 2, 4, and 8 worker threads — record throughput for each

**Test** (20 min):
- Run stress test with 4 workers, 50 clients, 100 frames each
- Record the contention metrics
- Which worker count gives best throughput?

**Done when:** You can measure lock contention. You know the optimal worker count for your machine.

```bash
git commit -am "day4: contention measurement + worker count tuning"
```

### Friday — Backpressure

**Read** (15 min): When clients send faster than the server can process, the queue grows.
If the queue is unbounded, you run out of memory. **Backpressure** means telling clients
"slow down" when the server is overloaded.

**Build** (90 min):
1. When work queue is > 80% full: respond to clients with a "server busy" envelope (new msg_type: OVERLOADED=3)
2. When queue is 100% full: stop accepting new frames (stop reading from sockets until queue drains)
3. When queue drops below 50%: resume accepting frames
4. Log every transition: "entering overloaded state", "leaving overloaded state"
5. Count: total rejected requests, total time in overloaded state

**Test** (20 min):
- Make workers artificially slow (sleep 100ms per task)
- Flood server with 100 clients sending rapidly
- Verify: server enters overloaded state, clients get OVERLOADED response
- When flood stops: server recovers, queue drains, normal service resumes

**Done when:** Server degrades gracefully under load. Never crashes from overload. Recovers when load drops.

```bash
git commit -am "day5: backpressure + overload handling"
```

### Saturday — Benchmark + Report

**Build** (3.5 hours):
1. Run full benchmark: throughput and latency at different load levels (10, 50, 100, 200 clients)
2. Record: normal throughput, overload threshold, recovery time
3. Find the breaking point: at what load does latency become unacceptable?
4. Compare: server with 1 worker vs 4 workers vs 8 workers
5. Write `week-4/README.md` with results table and conclusions

**Done when:** You know your server's limits. Benchmark table recorded.

```bash
git commit -am "day6: full benchmark + week-4 report"
git tag week-4-done
```

---

## Week 5 (originally Week 7): Hashing + Data Integrity

**Goal:** Add hash-based integrity checking to your protocol. After this week,
any change to a message's data will be detected.

**New concept — SHA-256:** A hash function that turns any amount of data into exactly
32 bytes. Changing even one bit of input produces completely different output.
It is practically impossible to find two different inputs with the same hash.

### Monday — Hash a File

**Read** (30 min): libsodium documentation for `crypto_hash_sha256`:
[https://doc.libsodium.org/hashing/generic_hashing](https://doc.libsodium.org/hashing/generic_hashing)

**Build** (80 min):
1. Install libsodium: `sudo apt install libsodium-dev`
2. Add to CMakeLists.txt: `find_package(PkgConfig REQUIRED)` and `pkg_check_modules(SODIUM REQUIRED libsodium)`, link to targets
3. Create `src/hash_tool.cpp`: reads a file, computes SHA-256, prints the hex hash
4. Usage: `./hash_tool path/to/file` → prints `sha256:a1b2c3d4...`
5. Test: hash the same file twice → same hash. Change one byte → completely different hash.

**Test** (20 min):
- Hash a known file → compare with `sha256sum` command (should match)
- Hash same file twice → identical output
- Change one byte in file → hash changes

**Done when:** Your hash tool produces the same output as `sha256sum`.

```bash
git commit -am "day1: SHA-256 file hashing with libsodium"
```

### Tuesday — Hash in Protocol

**Read** (15 min): Add a hash field to your protocol envelope. The sender hashes the
payload and includes the hash. The receiver recomputes the hash and compares. If they
don't match, the payload was changed (corrupted or tampered).

**Build** (90 min):
1. Add `payload_hash` field to your envelope (32 bytes, SHA-256 of payload)
2. Sender: compute hash of payload, put it in envelope
3. Receiver: compute hash of received payload, compare with `payload_hash` in envelope
4. If hashes don't match → reject message, log "integrity failure", close connection
5. Log the hash of every message processed (this creates an audit trail)

**Test** (20 min):
- Send valid message → hash matches, message processed
- Modify one byte of payload after hashing (simulate tampering) → receiver detects mismatch, rejects
- Send 100 valid messages → all pass integrity check

**Done when:** Every message is integrity-checked. Tampered messages are always detected and rejected.

```bash
git commit -am "day2: protocol integrity with payload hash"
```

### Wednesday — Streaming Hash for Large Data

**Read** (15 min): If you need to hash a 1GB file, you can't load it all into memory.
Instead, feed the hash function chunks at a time. libsodium supports this with
`crypto_hash_sha256_init()`, `_update()`, `_final()`.

**Build** (90 min):
1. Create streaming hash function: reads file in 4KB chunks, feeds each to hash state
2. Final result is identical to hashing the whole file at once (verify this!)
3. Memory usage stays under 8KB regardless of file size
4. Use this for any payload > 64KB in your protocol

**Test** (20 min):
- Hash a 10MB file with one-shot method and streaming method → same hash
- Monitor memory usage during streaming hash of 100MB file → stays low

**Done when:** Can hash arbitrarily large files without running out of memory.

```bash
git commit -am "day3: streaming hash for large data"
```

### Thursday — Canonicalization

**Read** (20 min): Hashing only works if both sides hash the exact same bytes.
If the sender sorts fields as A,B,C but the receiver sorts them B,A,C, they hash
different bytes and get different hashes — even though the data is "the same."
**Canonicalization** means defining one exact byte order for hashing.

**Build** (80 min):
1. Define strict byte format for your envelope's hashable fields
2. Write a `canonical_bytes()` function that always produces the same byte sequence for the same envelope
3. Field order is fixed: version, msg_type, request_id, timestamp, payload (always this order)
4. Strings are length-prefixed (4 bytes length + bytes), no null terminator
5. Integers are big-endian (network byte order)
6. Hash the canonical bytes, not the raw struct

**Test** (20 min):
- Create same envelope on two different machines (or with two different struct layouts) → same hash
- Swap two fields in the byte sequence → hash changes (proves ordering matters)

**Done when:** Hash is computed from canonical bytes, not from raw struct memory.

```bash
git commit -am "day4: canonical serialization for hashing"
```

### Friday — Integrity Audit Drill

**Read** (10 min): Your logger writes files. How do you know those files haven't been
changed since they were written? Answer: store the hash when you write, verify the hash
later. This is an **integrity audit**.

**Build** (90 min):
1. Add hash-tracking to your logger: after writing each entry, append the hash of the entry to a separate `.hash` file
2. Create `audit` command: reads each log entry, recomputes its hash, compares with stored hash
3. If mismatch found → report which entry was tampered, when, what the expected vs actual hash is
4. Test: manually edit one byte in a log file → audit catches it

**Test** (30 min):
- Write 100 entries, run audit → all pass
- Edit one byte in the log file, run audit → reports exactly which entry was tampered
- Delete the hash file, run audit → reports "hash file missing, cannot verify"

**Done when:** You can detect tampering in your own log files automatically.

```bash
git commit -am "day5: integrity audit for log files"
```

### Saturday — Integration + Report

**Build** (3.5 hours):
1. Full integration test: client sends signed envelope → server verifies hash → echoes with its own hash → client verifies server hash
2. Inject a tampered message mid-stream → verify detection
3. Run 1000-message throughput test with hashing enabled → compare with Week 4 numbers (hashing adds CPU cost)
4. Write `week-5/README.md` with integrity test results and performance comparison

**Done when:** All integrity tests pass. Hashing overhead measured and recorded.

```bash
git commit -am "day6: hashing integration + overhead measurement"
git tag week-5-done
```

---

## Week 6 (originally Week 8): Digital Signatures + Replay Defense

**Goal:** Add signatures so every message proves who sent it. Add replay defense
so old messages cannot be re-sent to trick the server.

**New concept — Ed25519:** A digital signature algorithm. You have a **private key**
(secret, only you have it) and a **public key** (shared with everyone). You sign with
the private key. Anyone can verify with the public key.

### Monday — Key Generation + Signing

**Read** (30 min): libsodium Ed25519 docs:
[https://doc.libsodium.org/public-key_cryptography/public-key_signatures](https://doc.libsodium.org/public-key_cryptography/public-key_signatures)

**Build** (80 min):
1. Create `src/keygen.cpp`: generates Ed25519 key pair, saves to files (`private.key`, `public.key`)
2. Create `src/sign.cpp`: takes a file and private key, produces a signature (64 bytes)
3. Create `src/verify.cpp`: takes a file, signature, and public key, prints "valid" or "invalid"
4. Usage: `./keygen` → creates key files. `./sign --key private.key --file data.txt` → prints signature.

**Test** (20 min):
- Sign a file, verify with correct public key → valid
- Sign a file, verify with wrong public key → invalid
- Change one byte of the file after signing → invalid

**Done when:** You can sign any file and verify the signature correctly.

```bash
git commit -am "day1: Ed25519 key generation + sign + verify"
```

### Tuesday — Signed Protocol Envelope

**Read** (15 min): Add a signature to your protocol envelope. The sender signs the
canonical bytes (from last week) with their private key. The receiver verifies
using the sender's public key.

**Build** (90 min):
1. Add `signature` field (64 bytes) and `key_id` field (identifies which public key to use) to envelope
2. Sender: compute canonical bytes → sign with private key → include signature in envelope
3. Receiver: extract canonical bytes → verify signature with sender's public key
4. If signature is invalid → reject, log "signature verification failed", close connection
5. Server has a list of known public keys (just load from a directory for now)

**Test** (20 min):
- Client signs with its key, server verifies → message processed
- Modify payload after signing → signature verification fails, message rejected
- Use unknown key_id → rejected with "unknown sender"

**Done when:** Every message in your protocol is signed and verified. Tampered or forged messages are rejected.

```bash
git commit -am "day2: signed protocol envelope"
```

### Wednesday — Replay Defense

**Read** (20 min): A **replay attack** is when someone captures a valid signed message and
sends it again later. The signature is still valid! Defense: add a **nonce** (random number
used once) and a timestamp. The receiver tracks recent nonces and rejects duplicates.

**Build** (80 min):
1. Add `nonce` field (16 random bytes) to envelope
2. Sender generates fresh nonce for every message
3. Receiver keeps a set of recently seen nonces (last 10,000)
4. If nonce was seen before → reject as replay, log "replay attempt detected"
5. If timestamp is more than 5 minutes old → reject as expired
6. Include nonce and timestamp in the canonical bytes (so they're covered by the signature)

**Test** (20 min):
- Send a valid message → accepted
- Send the exact same message again (same nonce) → rejected as replay
- Send a message with old timestamp → rejected as expired
- Send a message with modified nonce but same signature → signature fails

**Done when:** Replayed messages are always detected. Expired messages are rejected.

```bash
git commit -am "day3: nonce + timestamp replay defense"
```

### Thursday — Key Lifecycle

**Read** (15 min): Keys don't last forever. You need to: generate new keys, rotate from
old key to new key (both valid during transition), and revoke compromised keys.

**Build** (90 min):
1. Create a key store directory: each key has a file with `key_id`, `public_key`, `status` (active/revoked), `created_at`
2. Add `key-rotate` command: generates new key pair, marks old key as "deprecated"
3. Server accepts messages signed by any active key, rejects revoked keys
4. Add `key-revoke` command: marks a key as revoked with timestamp
5. After revocation: messages signed with revoked key are rejected, even if signature is valid

**Test** (20 min):
- Generate key A, sign message → valid
- Revoke key A, try same message → rejected (key revoked)
- Generate key B, sign message with B → valid
- During transition: both A and B work until A is revoked

**Done when:** You can generate, rotate, and revoke keys. Revoked keys are always rejected.

```bash
git commit -am "day4: key lifecycle — generate, rotate, revoke"
```

### Friday — Attack Drills

**Read** (10 min): Today you play attacker against your own system. Try to break it.

**Build** (100 min):
1. Replay attack: capture a valid signed message, send it 1 minute later → should be rejected
2. Forge attack: create a message, sign with a key the server doesn't know → should be rejected
3. Tamper attack: take valid signed message, change 1 byte of payload → should be rejected
4. Revoked key attack: sign with a revoked key → should be rejected
5. Expired message: create message with timestamp 10 minutes ago → should be rejected
6. Record results in `week-6/attack-drill-results.md`

**Test** (20 min): All 5 attacks must be detected and rejected with specific error messages.

**Done when:** Every attack is caught. No way to get a fake message accepted.

```bash
git commit -am "day5: attack drills — all defeated"
```

### Saturday — Month 2 Demo

**Build** (3.5 hours):
1. Full integration: client signs envelope with hash + signature + nonce → server verifies all three
2. Run 1000 messages through the signed protocol → measure overhead vs unsigned (Week 4 numbers)
3. Run all 5 attack drills automatically
4. Write `month-2/README.md`: what you built, protocol diagram, attack drill results, performance comparison
5. Tag `month-2-done`

**Done when:** Signed protocol works end-to-end. All attacks fail. Performance overhead measured.

```bash
git commit -am "day6: month-2 integration + demo"
git tag month-2-done
```

---

# Month 3: Durability + Replication

**Goal:** Make your data survive crashes and machine failures. After this month, your system
stores data on multiple machines, picks a new leader when one dies, and never loses committed data.

**Reading for this month:** Chapters 5, 7, and 9 of "Designing Data-Intensive Applications"
by Martin Kleppermann. This is THE book for distributed systems. Buy it or find it at a library.
Read chapter 5 (replication) before Week 9. Read slowly — one section per day is fine.

---

## Week 7: Key-Value Store + Write-Ahead Log

**Goal:** Build a key-value store (like a dictionary: store a value under a key, get it back
by key) that survives crashes by writing changes to a log before applying them.

**New concept — WAL (write-ahead log):** Before changing any data, write the change to an
append-only log file. If the program crashes, replay the log to recover. This is how
databases survive crashes.

### Monday — In-Memory KV Store

**Read** (15 min): A key-value store is the simplest useful storage. `put(key, value)` stores
data. `get(key)` retrieves it. `delete(key)` removes it. Start with everything in memory.

**Build** (90 min):
1. Create `src/kvstore.cpp` and `include/kvstore.h`
2. Use `std::unordered_map<std::string, std::string>` for storage
3. Implement `put(key, value)`, `get(key)`, `delete(key)`
4. Add version numbers: each key has a version that increments on every put
5. Create CLI: `./kv put --key name --value alice`, `./kv get --key name`
6. All commands use your signed protocol (from Month 2) — every operation is authenticated

**Test** (20 min):
- put("name", "alice") → get("name") returns "alice"
- put("name", "bob") → get("name") returns "bob", version is 2
- delete("name") → get("name") returns "not found"

**Done when:** KV store works with get/put/delete. Each operation is signed.

```bash
git commit -am "day1: in-memory KV store with signed commands"
```

### Tuesday — Write-Ahead Log

**Read** (20 min): Your KV store currently loses all data on crash. Fix: before applying
any change, write it to a log file. On restart, replay the log to rebuild the map.

**Build** (80 min):
1. Create `src/wal.cpp` and `include/wal.h`
2. WAL format: each record is `[length][lsn][operation][key][value][checksum]\n`
   - **lsn** = log sequence number (increments per record, like an ID for each change)
   - **operation** = PUT or DELETE
   - **checksum** = hash of the record bytes (detect corruption)
3. Before each put/delete: write WAL record, call fsync, then apply to in-memory map
4. On startup: if WAL file exists, replay all records to rebuild the map

**Test** (20 min):
- Put 10 keys, kill process, restart → all 10 keys recovered from WAL
- Corrupt one byte in WAL → that record is detected and skipped, other records replay correctly

**Done when:** KV store recovers all data from WAL after crash.

```bash
git commit -am "day2: write-ahead log with crash recovery"
```

### Wednesday — Crash Drills

**Read** (10 min): You need to crash your program at specific points and verify it recovers.

**Build** (100 min):
1. Add a "crash point" mechanism: program crashes after WAL write but before applying to map
2. Test: write WAL record, crash, restart → record is replayed, data is correct
3. Add crash point: crash mid-WAL-write (partial record) → on restart, detect truncated record, skip it safely
4. Add crash point: crash after apply but before advancing the WAL position → on restart, replay is idempotent (applying same change twice gives same result)
5. Document each crash scenario and recovery result

**Test** (20 min):
- Crash after WAL write, before apply → data recovered ✓
- Crash mid-WAL-write → partial record skipped, previous data intact ✓
- Double-apply same WAL record → no corruption ✓

**Done when:** Program recovers correctly from every crash point.

```bash
git commit -am "day3: crash drills — all recovery paths tested"
```

### Thursday — Snapshot

**Read** (15 min): If the WAL grows forever, replay takes longer and longer on startup.
A **snapshot** dumps the current state to a file. On restart, load snapshot first,
then replay only WAL records after the snapshot.

**Build** (85 min):
1. Add `snapshot()` method: writes entire KV state to a file with a checksum
2. Record the last LSN included in the snapshot
3. On startup: load snapshot (if exists), then replay WAL from snapshot's LSN + 1
4. After successful snapshot, old WAL records before the snapshot LSN can be deleted
5. CLI: `./kv snapshot` triggers a snapshot

**Test** (20 min):
- Put 1000 keys, snapshot, add 10 more keys, restart → all 1010 keys present
- Corrupt snapshot file → detected, falls back to full WAL replay
- Delete snapshot → falls back to full WAL replay

**Done when:** Snapshot + WAL recovery works. Startup time is proportional to changes since last snapshot.

```bash
git commit -am "day4: snapshot + truncated WAL recovery"
```

### Friday — Fsync Tuning + Benchmarks

**Read** (15 min): Calling fsync after every WAL write is safe but slow. Batching multiple
writes before one fsync is faster but risks losing recent writes on crash.

**Build** (85 min):
1. Implement three fsync modes: `EVERY_WRITE` (safest), `BATCH_10MS` (fsync every 10ms), `NONE` (fastest, unsafe)
2. Benchmark all three modes: puts per second with 10,000 operations
3. For each mode: run crash drill → how many writes can be lost?
4. Document the tradeoff: speed vs safety for each mode

**Test** (20 min):
- `EVERY_WRITE`: 0 writes lost on crash, but slower
- `BATCH_10MS`: up to 10ms of writes lost, much faster
- `NONE`: any recent writes can be lost, fastest

**Done when:** Three fsync modes working. Benchmark table showing speed vs data-loss risk.

```bash
git commit -am "day5: fsync modes + durability benchmarks"
```

### Saturday — Integration + Report

**Build** (3.5 hours):
1. Full integration: KV server accepts signed commands over TCP, writes WAL, handles crashes
2. Crash matrix: test 5 different crash points, all must recover correctly
3. Benchmark: operations/sec for each fsync mode over TCP
4. Write `week-7/README.md` with crash drill results and benchmark table

**Done when:** Durable KV store works over TCP with signed commands. All crash drills pass.

```bash
git commit -am "day6: durable KV integration"
git tag week-7-done
```

---

## Week 8: Replication (Multiple Nodes)

**Goal:** Run your KV store on 3 nodes. Data written to the leader is copied to followers.
If one node dies, data is still safe on the other two.

**New concept — replication:** Keeping copies of data on multiple machines.
If one machine dies, the others still have the data.

**New concept — quorum:** A majority of nodes. In a 3-node cluster, quorum = 2.
Data is "committed" (safe) when a quorum has confirmed it.

**Reading:** DDIA Chapter 5 (Replication) — read this week.

### Monday — Failure Model

**Read** (30 min): DDIA Chapter 5, section on "Leaders and Followers."
Key point: in our model, machines can crash (stop responding) and messages can be delayed
or lost. But machines don't lie — they either respond correctly or not at all.
(Lying machines is the **Byzantine** problem — we handle that later.)

**Build** (80 min):
1. Document your failure assumptions: crash-stop (nodes crash, don't send wrong data), messages can be lost/delayed
2. Define node roles: one **leader** (accepts writes), two **followers** (receive copies)
3. Create `src/replication.h`: define `AppendEntries` RPC (Remote Procedure Call — a message asking a follower to store a WAL record)
4. AppendEntries contains: leader's term, previous log index/term (for consistency check), the WAL entries to append
5. Follower responds: success (entries appended) or failure (mismatch with my log)

**Test** (20 min):
- Define 3 node configs (different ports on localhost: 9001, 9002, 9003)
- Leader starts and is ready to accept writes
- Followers start and are ready to receive AppendEntries

**Done when:** Three nodes can start. Message types defined. Failure model documented.

```bash
git commit -am "day1: 3-node cluster setup + failure model"
```

### Tuesday — Leader-to-Follower Replication

**Read** (15 min): When leader receives a write: (1) append to own WAL, (2) send AppendEntries
to all followers, (3) wait for quorum (majority) to confirm.

**Build** (90 min):
1. Leader receives put/delete command → writes to own WAL
2. Leader sends AppendEntries to each follower with the new WAL records
3. Follower receives AppendEntries → checks that prev_index/prev_term matches its log
4. If match → append entries, respond success
5. If mismatch → respond failure (leader will retry with earlier entries)
6. Leader waits for at least 1 follower to confirm (2 out of 3 = quorum) before telling client "success"

**Test** (20 min):
- Client puts key on leader → leader has it, both followers have it
- Kill one follower → writes still succeed (2 out of 3 is still quorum)
- Verify: leader and surviving follower have identical data

**Done when:** Writes replicate to followers. Writes succeed as long as quorum is alive.

```bash
git commit -am "day2: leader-to-follower replication with quorum"
```

### Wednesday — Follower Catch-Up

**Read** (15 min): What if a follower was down for a while and missed entries?
When it comes back, the leader detects the gap and sends the missing entries.

**Build** (90 min):
1. When AppendEntries fails (prev_index mismatch), leader tries again with an earlier index
2. Leader keeps stepping back until it finds where the follower's log matches
3. Then leader sends all entries from that point forward
4. Set a limit: if follower is more than 10,000 entries behind, send a snapshot instead
5. Log: "follower node-2 caught up at index 5432"

**Test** (20 min):
- Write 100 entries while follower is down → restart follower → follower catches up to 100
- Verify: follower hash matches leader hash after catch-up

**Done when:** Followers can fall behind and catch up automatically.

```bash
git commit -am "day3: follower catch-up + snapshot fallback"
```

### Thursday — Partition Behavior

**Read** (20 min): A **network partition** is when some nodes can't talk to each other but
each group thinks the others might be dead. Key rule: the side with less than quorum
must NOT accept writes (otherwise you get conflicting data).

**Build** (80 min):
1. If leader can't reach quorum of followers → stop accepting writes, return "unavailable" to clients
2. If follower can't reach leader → stop serving reads (data might be stale)
3. When network heals → follower reconnects, catches up, system resumes
4. Log: "partition detected, entering read-only mode" / "partition healed, resuming"

**Test** (20 min):
- Block network between leader and one follower → writes still work (2/3 quorum)
- Block network between leader and both followers → writes fail with "unavailable"
- Unblock → system recovers, followers catch up

**Done when:** System is safe during partitions. No conflicting writes possible.

```bash
git commit -am "day4: partition behavior — safe unavailability"
```

### Friday — State Verification

**Read** (10 min): How do you know all nodes have identical data? Compute a hash of the
entire KV state. If all node hashes match, state is consistent.

**Build** (100 min):
1. Add `state_hash()` method to KV store: hashes all key-value pairs in sorted order
2. Compare state hashes across all 3 nodes after operations
3. Add to integration test: after every drill, verify state hashes match
4. If hashes don't match → something is wrong, log the divergence details

**Test** (20 min):
- Write 100 entries, check state hash on all 3 nodes → identical
- Kill follower, write 50 more, restart follower, wait for catch-up → state hashes identical
- Run partition test, heal, catch up → state hashes identical

**Done when:** State hashes match across all nodes after every test scenario.

```bash
git commit -am "day5: cross-node state verification"
```

### Saturday — Integration + Report

**Build** (3.5 hours):
1. Full cluster integration test: writes, replication, follower failure, catch-up, partition, recovery
2. Read Raft paper introduction and section 5 (leader election): [https://raft.github.io/raft.pdf](https://raft.github.io/raft.pdf) — just skim for concepts, you'll implement next week
3. Write `week-8/README.md` with test results and state hash verification evidence

**Done when:** 3-node cluster survives all failure scenarios. State always converges.

```bash
git commit -am "day6: replication integration"
git tag week-8-done
```

---

## Week 9: Leader Election + Client Safety

**Goal:** When the leader dies, followers automatically elect a new leader. Clients retry
safely without causing duplicate writes.

**Reading:** Raft paper sections 5.1–5.4: [https://raft.github.io/raft.pdf](https://raft.github.io/raft.pdf)
Read slowly. Focus on: terms, election timeout, vote rules.

### Monday — Election Timeout + Terms

**Read** (30 min): Raft paper section 5.2. Key concepts:
- **Term:** A number that increases every election. Like a "generation." If you see a higher term, your info is old.
- **Election timeout:** If a follower doesn't hear from the leader for this long, it starts an election.
- Randomize the timeout (e.g., 150–300ms) so all followers don't start elections at the same time.

**Build** (80 min):
1. Add term tracking to each node (starts at 0)
2. Each node has a randomized election timeout (150–300ms)
3. If follower doesn't receive heartbeat from leader within timeout → become a **candidate**
4. Candidate increments term, votes for itself, asks other nodes for votes
5. Leader sends heartbeats every 50ms to prevent elections

**Test** (20 min):
- Start 3 nodes with one as leader → no elections happen (heartbeats prevent them)
- Kill leader → within ~300ms, one follower becomes candidate and requests votes

**Done when:** Election timeout triggers when leader dies. Candidates request votes.

```bash
git commit -am "day1: election timeout + term tracking"
```

### Tuesday — Vote Rules

**Read** (20 min): Raft paper section 5.4. A node votes for a candidate only if:
1. The candidate's term is at least as high as the voter's term
2. The candidate's log is at least as up-to-date as the voter's log
3. The voter hasn't already voted for someone else in this term

**Build** (90 min):
1. Implement RequestVote RPC: candidate sends its term, last log index, last log term
2. Voter checks: is candidate's term >= mine? Is candidate's log >= mine? Have I voted this term?
3. If all checks pass → grant vote, update my term
4. If candidate receives votes from majority → becomes leader, starts sending heartbeats
5. If two candidates split votes → neither wins, new election after timeout

**Test** (20 min):
- Kill leader → new leader elected within 1 second
- Verify: new leader has all committed entries from old leader
- Force split vote → new election happens, eventually one leader wins

**Done when:** Automatic leader election works. New leader has all committed data.

```bash
git commit -am "day2: vote rules + leader election"
```

### Wednesday — Client Retry + Idempotency

**Read** (15 min): When the leader dies during a client's write, the client doesn't know
if the write succeeded. So the client retries. But if the write DID succeed before the crash,
the retry creates a duplicate. Fix: every write has a unique request_id. The server remembers
recent request_ids and returns the original result for duplicates.

**Build** (90 min):
1. Client includes request_id with every write (you already have this from Month 1)
2. Server keeps a table of recently processed request_ids (last 10,000)
3. If request_id was already processed → return the original result, do NOT re-execute the write
4. On leader change: client detects "not leader" error, finds new leader, retries with SAME request_id
5. This is called **idempotent retry** — retrying doesn't change the result

**Test** (20 min):
- Send write, succeed, send same request_id again → second attempt returns same result, no duplicate entry
- Kill leader during write, retry to new leader → write happens exactly once
- Verify: no duplicate keys in KV store after 100 retries

**Done when:** Client retries never cause duplicate writes. Exactly-once semantics.

```bash
git commit -am "day3: idempotent retry — exactly-once writes"
```

### Thursday — Stale Leader Fencing

**Read** (15 min): After a network partition heals, the old leader might try to accept writes
even though a new leader was elected. Fix: every message includes the term. If a node sees
a higher term, it steps down immediately.

**Build** (85 min):
1. Every RPC includes the sender's term
2. If a node receives a message with a higher term → step down to follower, update term
3. If the old leader receives AppendEntries from new leader → step down immediately
4. If client sends write to old leader → old leader responds "not leader, try node X"
5. Log: "stepping down: saw term 5, my term is 3"

**Test** (20 min):
- Partition leader from followers → new leader elected → heal partition → old leader steps down
- Client connected to old leader gets redirected to new leader
- No writes are lost, no duplicates

**Done when:** Stale leader always steps down. No split-brain writes.

```bash
git commit -am "day4: stale leader fencing + term-based stepdown"
```

### Friday — Read Code: Raft Implementation

**Read** (2h): Read a real Raft implementation. Pick one:
- **etcd/raft** (Go): [https://github.com/etcd-io/raft](https://github.com/etcd-io/raft) — look at `raft.go`, focus on `Step()` function
- **willemt/raft** (C): [https://github.com/willemt/raft](https://github.com/willemt/raft) — simpler, closer to your language

**Build** (30 min):
Write `week-9/code-reading-notes.md`: 5 things the production implementation handles that yours doesn't yet.

**Done when:** Notes written with 5 specific gaps between your implementation and production.

```bash
git commit -am "day5: Raft code reading notes"
```

### Saturday — Month 3 Demo

**Build** (3.5 hours):
1. Full cluster demo: start 3 nodes, write data, kill leader, election, client retries, data safe
2. Run scripted failure sequence: leader crash → election → more writes → kill new leader → another election → verify all data
3. State hash comparison after every step
4. Write `month-3/README.md` with: architecture diagram, failure test results, state hash evidence
5. Tag `month-3-done`

**Done when:** 3-node cluster survives multiple leader failures with zero data loss.

```bash
git commit -am "day6: month-3 demo — replicated fault-tolerant KV"
git tag month-3-done
```

---

# Month 4: Tamper-Evident Transparency

**Goal:** Build a system where anyone can verify that data was not changed or hidden.
This is the core of "don't trust one server." After this month, you have a public
log that mathematically proves its integrity.

---

## Week 10: Content-Addressed Storage

**Goal:** Store data by its hash. If data changes, the address changes. Tampering is visible.

### Monday — CAS Basics

**Read** (20 min): In content-addressed storage (**CAS**), the address of data IS its hash.
`store("hello")` → address is `sha256("hello")` → `2cf24dba...`. If you change "hello" to
"hallo", the hash is completely different. So any change means a different address.

**Build** (80 min):
1. Create `src/cas.cpp` and `include/cas.h`
2. `store(data)`: hash the data, save to file named by hash, return hash as ID
3. `retrieve(hash)`: read file, verify content matches hash, return data
4. `verify(hash)`: re-hash stored content, return true if matches
5. Storage layout: `data/ab/cd/abcdef1234...` (split hash into directories for filesystem efficiency)

**Test** (20 min):
- Store "hello", retrieve by hash → get "hello" back
- Store "hello" twice → same hash, same file, no duplicate
- Modify stored file on disk → `verify()` fails, `retrieve()` fails

**Done when:** Data is stored and retrieved by content hash. Any tampering is detected.

```bash
git commit -am "day1: content-addressed storage"
```

### Tuesday — Atomic Writes + Chunk Support

**Build** (100 min):
1. Atomic write: write to temp file first, then rename to final path. If crash during write, no partial file with a valid hash name exists.
2. Chunk large files: split into 4KB chunks, store each chunk in CAS
3. Create a **manifest**: a list of chunk hashes in order, stored as its own CAS object
4. Retrieve large file: read manifest, retrieve each chunk, reassemble
5. Manifest hash = address of the whole file

**Test** (30 min):
- Store 1MB file → manifest + chunks created
- Retrieve by manifest hash → identical file back
- Reorder chunks in manifest → detection (wrong hash)

**Done when:** Large files chunked and reassembled correctly. Atomic writes prevent corruption.

```bash
git commit -am "day2: atomic writes + chunked storage"
```

### Wednesday–Saturday: Follow the same pattern for:
- **Wed:** Garbage collection — safely delete unreferenced objects
- **Thu:** Integrity audit — scan all objects, verify all hashes
- **Fri:** Integrate CAS with KV store (KV stores references to CAS objects)
- **Sat:** Integration test + report

---

## Week 11: Merkle Trees

**Goal:** Build a hash tree that can prove any single item is part of a large set,
using only a small proof (log(N) hashes, not the entire set).

**New concept — Merkle tree:** A binary tree where each leaf is a hash of data,
and each parent is a hash of its two children. The root hash commits to ALL the data.
To prove one item is in the tree, you only need the "sibling" hashes along the path to the root.

### Monday — Build the Tree

**Read** (30 min): How Merkle trees work — draw it on paper with 4 leaves.

**Build** (80 min):
1. Create `src/merkle.cpp` and `include/merkle.h`
2. Given N data items: hash each one (leaves), then pair them up and hash pairs (parents), repeat until one root
3. Handle odd number of leaves: promote the unpaired leaf directly
4. Return the root hash

**Test** (20 min):
- 4 items → tree with 3 levels, deterministic root
- Same 4 items in same order → same root
- Change one item → root changes

**Done when:** Merkle tree produces correct, deterministic root hash.

```bash
git commit -am "day1: Merkle tree construction"
```

### Tuesday–Saturday: Follow the same pattern for:
- **Tue:** Inclusion proof — generate proof that item X is at position Y
- **Wed:** Verify inclusion proof — recompute root from proof path, compare with known root
- **Thu:** Consistency proof — prove tree at size N is a prefix of tree at size M
- **Fri:** Edge cases + property-based testing (fuzz random trees, verify proofs always work or fail correctly)
- **Sat:** Benchmark proof size vs tree size + integration test

---

## Week 12: Transparency Log + Signed Checkpoints

**Goal:** Build an append-only log backed by a Merkle tree. The log operator signs the
root hash at regular intervals. Anyone can verify that the log only grows (never deletes or changes).

### Monday–Saturday:
- **Mon:** Append-only log: each new entry adds a leaf, updates the Merkle tree
- **Tue:** Signed checkpoint: operator signs (tree_size, root_hash) with their Ed25519 key
- **Wed:** Inclusion proof for any entry: "this document is in the log at position X"
- **Thu:** Consistency proof between checkpoints: "the log at checkpoint A is a prefix of checkpoint B"
- **Fri:** Combined verification: given a document, verify it's in the log and the log is consistent
- **Sat:** Full integration + Month 4 prep

---

## Week 13: Monitors + Equivocation Detection + Month 4 Demo

**Goal:** Build independent monitors that watch the log and catch cheating.

**New concept — equivocation:** If the log operator signs two different roots for the same
tree size, they're cheating. Monitors detect this by comparing checkpoints.

### Monday–Saturday:
- **Mon:** Monitor service: fetches latest checkpoint from log, stores it
- **Tue:** Consistency checking: monitor verifies new checkpoint is consistent with last one
- **Wed:** Gossip: monitors share checkpoints with each other
- **Thu:** Equivocation detection: if two checkpoints have same size but different roots → alert
- **Fri:** Read Certificate Transparency code (Google's Trillian: [https://github.com/google/trillian](https://github.com/google/trillian))
- **Sat:** Month 4 demo: append + proof + verify + monitor + equivocation drill

```bash
git tag month-4-done
```

---

# Month 5: CivicTrust Capstone

**Goal:** Compose everything into one system: issue signed documents, anchor them in
the transparency log, and let anyone verify them — even offline.

## Week 14: Document Issuance
- **Mon:** Document schema + issuer identity
- **Tue:** Issuance flow: validate → sign → store in CAS
- **Wed:** Verification: check signature + check issuer
- **Thu:** Revocation: mark documents as revoked
- **Fri:** Policy gates: only authorized issuers can sign certain document types
- **Sat:** Issue 5 documents, verify all, revoke one, verify revocation

## Week 15: Transparency Anchoring
- **Mon:** Anchoring flow: hash document → append to transparency log → get inclusion proof
- **Tue:** Receipt bundle: inclusion proof + signed checkpoint = proof of existence
- **Wed:** Verify anchored document: check receipt + check document signature
- **Thu:** Freshness: reject stale receipts
- **Fri:** Failure handling: what if anchoring fails after signing
- **Sat:** Full pipeline: issue → sign → anchor → receipt → verify

## Week 16: Offline Verification + Chaos Testing
- **Mon:** Offline bundle: document + receipt + trust roots in one package
- **Tue:** Air-gapped verifier: verify with zero network access
- **Wed:** Chaos testing: crash leader during issuance — no duplicate documents
- **Thu:** Partition testing: minority cannot finalize documents
- **Fri:** Key compromise drill: revoke key, rotate, verify impact
- **Sat:** Month 5 demo: full CivicTrust system with failure drills

```bash
git tag month-5-done
```

---

# Month 6: Production Polish + Job Prep

**Goal:** Turn your technical work into an employable story. Define what "healthy" means,
map all attacks, make your work presentable, practice interviews.

## Week 17: Observability + SLOs
- **Mon:** Define SLIs (what you measure) and SLOs (what "good" means): latency, error rate, replication lag
- **Tue:** Add metrics to your system: track every SLI
- **Wed:** Structured logging review: can you trace a request across all nodes?
- **Thu:** Alert rules: what conditions should wake someone up?
- **Fri:** Capacity planning: how much load can your system handle?
- **Sat:** Write SLO report

## Week 18: Security + Threat Modeling
- **Mon:** Threat model: who could attack, what could go wrong
- **Tue:** Attack surface: list every input and trust boundary
- **Wed:** Test defenses: replay attack, stale checkpoint, forged signature
- **Thu:** Dependency audit: what libraries do you trust? Are they updated?
- **Fri:** Write security report with threat-to-defense mapping
- **Sat:** Remediation priorities + hardening report

## Week 19: Documentation + Portfolio
- **Mon:** Architecture diagram: the full system on one page
- **Tue:** README: what it does, how to build, how to run, how to verify
- **Wed:** Demo script: 5-minute walkthrough with one failure drill
- **Thu:** Read production code: sigstore ([https://github.com/sigstore](https://github.com/sigstore)) or Certificate Transparency
- **Fri:** Story bank: 5 technical stories for interviews (problem → approach → result → what you learned)
- **Sat:** Polish portfolio repo + publish

## Week 20: Interview Prep + Final Demo
- **Mon:** Distributed systems Q&A: consensus, replication, CAP theorem, failure modes
- **Tue:** Cryptography Q&A: hashing, signatures, Merkle proofs, limitations
- **Wed:** Debugging drills: reproduce and fix real bugs from your project, timed
- **Thu:** System design walkthrough: explain CivicTrust evolution from scratch
- **Fri:** Final demo rehearsal with timer (5 minutes, includes failure drill)
- **Sat:** Retrospective + what to learn next + publish everything

```bash
git tag month-6-done
```

---

# Glossary (Terms in Order of First Appearance)

| Term | Simple meaning |
|------|---------------|
| **RAII** | C++ pattern: resources (files, memory) are freed automatically when the object is destroyed |
| **TCP** | Protocol for reliable byte delivery between two machines |
| **byte stream** | TCP delivers raw bytes in order, with no message boundaries |
| **length-prefix framing** | Send 4 bytes of length, then that many bytes of data. This creates message boundaries. |
| **poll()** | System call that watches many sockets and tells you which ones are ready |
| **thread** | Separate flow of execution inside your program |
| **mutex** | Lock that prevents two threads from accessing the same data at once |
| **data race** | Two threads accessing the same data without locks — undefined behavior |
| **backpressure** | Telling senders to slow down when the receiver is overloaded |
| **SHA-256** | Hash function: any data → 32-byte fingerprint. Changes completely if input changes. |
| **digital signature** | Mathematical proof that a specific private key created a message |
| **Ed25519** | A fast, secure signature algorithm |
| **nonce** | Random number used only once, prevents replay attacks |
| **replay attack** | Re-sending a valid old message to trick the receiver |
| **WAL** | Write-ahead log: write changes to a log before applying, so you can recover after crash |
| **LSN** | Log sequence number: unique ID for each WAL entry |
| **snapshot** | Full dump of current state to a file (speeds up recovery) |
| **replication** | Keeping copies of data on multiple machines |
| **quorum** | Majority of nodes (2 of 3, 3 of 5). Used to decide when data is safe. |
| **leader** | The one node that accepts writes and sends copies to followers |
| **follower** | A node that receives copies from the leader |
| **term** | A generation number that increases with each election |
| **election** | When followers vote for a new leader after the old one dies |
| **partition** | Network failure where some nodes can't talk to each other |
| **CAS** | Content-addressed storage: data's address is its hash |
| **Merkle tree** | Hash tree where the root commits to all leaves |
| **inclusion proof** | Proof that one item is in a Merkle tree (log(N) hashes) |
| **consistency proof** | Proof that a smaller tree is a prefix of a larger tree |
| **checkpoint** | Signed statement of tree size and root hash at a point in time |
| **equivocation** | Signing two different roots for the same tree size (cheating) |
| **monitor** | Independent service that watches a log for consistency and cheating |
| **SLI** | Service level indicator: what you measure (e.g., latency) |
| **SLO** | Service level objective: what "good" means (e.g., p99 latency < 100ms) |

---

# Resources (Read as Each Month Needs Them)

| Resource | When | What to focus on |
|----------|------|-----------------|
| [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/) | Month 1 | Socket basics, written in casual English |
| [libsodium documentation](https://doc.libsodium.org/) | Month 2 | Hashing, signatures, key generation |
| [Designing Data-Intensive Applications](https://dataintensive.net/) (book) | Month 3 | Chapters 5, 7, 9: replication, transactions, consistency |
| [Raft paper](https://raft.github.io/raft.pdf) | Week 9 | Leader election, log replication |
| [Certificate Transparency RFC 6962](https://www.rfc-editor.org/rfc/rfc6962) | Month 4 | Merkle trees for transparency logs |
| [Google Trillian](https://github.com/google/trillian) | Month 4 | Production transparency log (code reading) |
| [sigstore](https://github.com/sigstore) | Month 6 | Production signing/verification infrastructure |
