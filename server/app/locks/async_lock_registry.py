import asyncio


class AsyncLockRegistry:
    """Per-key async locks so concurrent requests for the *same missing*
    reference don't each trigger their own download + analysis (the "cache
    stampede" the spec calls out). In-process only — a multi-worker/multi-
    machine deployment would need a distributed lock (e.g. Redis) instead;
    left as a clearly-scoped future upgrade rather than guessed at here.
    """

    def __init__(self) -> None:
        self._locks: dict[str, asyncio.Lock] = {}
        self._registry_guard = asyncio.Lock()

    async def get(self, key: str) -> asyncio.Lock:
        async with self._registry_guard:
            lock = self._locks.get(key)
            if lock is None:
                lock = asyncio.Lock()
                self._locks[key] = lock
            return lock


reference_locks = AsyncLockRegistry()
