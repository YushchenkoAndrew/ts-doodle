def test():
    return 1

a = 1 + test()

b = test

print(b())

# b = a = 1
# c = lambda a: a + 10