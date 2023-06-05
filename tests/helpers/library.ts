import constructBottle from "@bottle";
import { TEST_INIT_OPTIONS } from "@tests/constants";

/**
 * Constructs a bottle using TEST_INIT_OPTIONS
 */
export const constructTestBottle = () => {
  const bottle = constructBottle(TEST_INIT_OPTIONS);

  return bottle;
};