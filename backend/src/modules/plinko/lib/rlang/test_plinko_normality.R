install.packages("dplyr")
install.packages("ggpubr")
install.packages("nortest")

library("dplyr")
library("ggpubr")
library("nortest")

my_data <- read.csv(file.choose())

hist(my_data$holes, xlab = "Hole number", col = "green", border = "black")
ggdensity(my_data$holes, 
          main = "Density plot of holes",
          xlab = "Hole number")


ggqqplot(my_data$holes)

ad.test(my_data$holes)

set.seed(1234)
sampled <- dplyr::sample_n(my_data, 5000, replace= TRUE)
shapiro.test(sampled$holes)



