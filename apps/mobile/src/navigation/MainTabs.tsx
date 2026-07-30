import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AnotarIcon, CriarIcon, FoxIcon, OrbitIcon, RotinaIcon } from "../icons/index";
import { AnotarScreen } from "../modules/anotar/AnotarScreen";
import { CriarScreen } from "../modules/criar/CriarScreen";
import { HomeScreen } from "../modules/home/HomeScreen";
import { OrbitaScreen } from "../modules/orbita/OrbitaScreen";
import { RotinaScreen } from "../modules/rotina/RotinaScreen";
import { colors } from "../theme/theme";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.panelSolid, borderTopColor: colors.line },
      }}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <FoxIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Rotina"
        component={RotinaScreen}
        options={{ tabBarIcon: ({ color, size }) => <RotinaIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Anotar"
        component={AnotarScreen}
        options={{ tabBarIcon: ({ color, size }) => <AnotarIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Criar"
        component={CriarScreen}
        options={{ tabBarIcon: ({ color, size }) => <CriarIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Órbita"
        component={OrbitaScreen}
        options={{ tabBarIcon: ({ color, size }) => <OrbitIcon color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
