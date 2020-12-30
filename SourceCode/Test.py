def test():
    return 1

# a = 1 + test()

a = "5"
# a()

b = test
c = b

print(b())
print(c())

# b = a = 1
c = lambda a: a + 10

print(c(5))
# a = a + 1