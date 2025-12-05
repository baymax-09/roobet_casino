install.packages("dplyr")
install.packages("ggpubr")
install.packages("nortest")

library("dplyr")
library("ggpubr")
library("nortest")

one_million_simulated <- read.csv(file.choose())
all_paths_combinations <- read.csv(file.choose())


hist(one_million_simulated$holes, xlab = "Hole number", col = "green", border = "black")
hist(all_paths_combinations$holes, xlab = "Hole number", col = "green", border = "black")

ggdensity(one_million_simulated$holes, 
          main = "Density plot of 1mil holes",
          xlab = "Hole number")

ggdensity(all_paths_combinations$holes, 
          main = "Density plot of exhaustive holes",
          xlab = "Hole number")


ggqqplot(one_million_simulated$holes)

ad.test(one_million_simulated$holes)
ad.test(all_paths_combinations$holes)


set.seed(1234)
sampled <- dplyr::sample_n(one_million_simulated, 5000, replace= TRUE)
shapiro.test(sampled$holes)



