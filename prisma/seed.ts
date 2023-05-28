import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function isUnique(result: any, uniqueArr: {[index: string]:any}[], uniqueKey: string): boolean {
	for (let i = 0; i < uniqueArr.length; i++) {
		if (uniqueArr[i][uniqueKey] === result) {
			return false
		}
	}
	return true
}
function rBool(): boolean {
	return Math.random() < 0.5
}
function rString(min: number, max: number = min, uniqueArr?: {[index: string]:any}[], uniqueKey?: string): string {
	let length = rNumber(min, max)
	let result = [...Array(length)].map(() => (Math.random() || 0.69).toString(36)[2]).join('')

	if ((!uniqueArr || !uniqueKey) || isUnique(result, uniqueArr, uniqueKey)) {
		return result
	} else {
		return rString(min, max, uniqueArr, uniqueKey)
	}
}
function rNumber(min: number, max: number = min, uniqueArr?: {[index: string]:any}[], uniqueKey?: string): number {
	let result = Math.floor(Math.random() * (max + 1 - min) + min)

	if ((!uniqueArr || !uniqueKey) || isUnique(result, uniqueArr, uniqueKey)) {
		return result
	} else {
		return rNumber(min, max, uniqueArr, uniqueKey)
	}
}

async function createUsers(number: number): Promise<"done"> {
	let users: Prisma.UserCreateInput[] = []
	
	for (let i = 0; i < number; i++) {
		let countryCode = rString(2).toUpperCase()
		users.push({
			isAdmin: rBool(),
			osuUserId: rNumber(1, 99999999, users, "osuUserId"),
			isRestricted: rBool(),
			osuUsername: rString(3, 16, users, "osuUsername"),
			discordUserId: rString(3, 19, users, "discordUserId"),
			discordUsername: rString(3, 32),
			discordDiscriminator: rNumber(1, 9999),
			apiKey: rString(24),
			osuAccessToken: rString(64),
			osuRefreshToken: rString(64),
			discordAccesstoken: rString(64),
			discordRefreshToken: rString(64),
			country: {
				connectOrCreate: {
					create: {
						code: countryCode,
						name: rString(6, 24)
					},
					where: {
						code: countryCode
					}
				}
			}
		})
	}

	for (let i = 0; i < users.length; i++) {
		await prisma.user.create({data: users[i]})
		process.stdout.write(".")
	}

	return "done"
}

async function main() {
	console.log("Users: ")
	console.log(await createUsers(50))
}


main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
