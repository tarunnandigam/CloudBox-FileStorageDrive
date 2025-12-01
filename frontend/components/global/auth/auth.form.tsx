"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { sendOTP, verifyOTP } from "@/lib/auth/auth.actions";
import { useUser } from "@/context/user.context";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const authSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  otp: z.string().optional(),
});

export function AuthFormCard() {
  const [otpSent, setOtpSent] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const { toast } = useToast();
  const router = useRouter();
  const { setUserFromEmail } = useUser();

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: "", email: "", otp: "" },
  });

  const onSendOTP = async () => {
    const name = form.getValues("name");
    const email = form.getValues("email");
    
    if (!name) {
      form.setError("name", { message: "Name is required" });
      return;
    }
    if (!email) {
      form.setError("email", { message: "Email is required" });
      return;
    }
    
    try {
      const res = await sendOTP(email);
      if (res.success) {
        setOtpSent(true);
        setUserId(res.userId || "");
        toast({
          title: "OTP Sent",
          description: "Check your email for the 6-digit OTP",
        });
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    if (!otpSent) return;
    
    try {
      const res = await verifyOTP(userId, values.otp || "");
      if (res.success) {
        // Set user in context with name
        setUserFromEmail?.(values.email, values.name);
        
        toast({
          title: "Authentication Successful",
          description: "Redirecting...",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid OTP",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setOtpSent(false);
    setUserId("");
    form.reset();
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Card className="w-full border-gray-800 bg-gray-950">
          <CardHeader className="space-y-3 pb-4">
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Image
                src="/cloudboxpinklogo.png"
                alt="CloudBox"
                width={40}
                height={40}
              />
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">CloudBox</h1>
                <p className="text-sm text-gray-400 mt-1">Continue with email OTP sign in</p>
              </div>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Name</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="Enter your name"
                          disabled={otpSent}
                          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email"
                          disabled={otpSent}
                          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!otpSent && (
                  <Button 
                    type="button" 
                    onClick={onSendOTP} 
                    className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white"
                  >
                    Send OTP
                  </Button>
                )}

                {otpSent && (
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-center block">Enter 6-digit OTP</FormLabel>
                        <FormControl>
                          <div className="flex justify-center">
                            <InputOTP 
                              value={field.value}
                              onChange={field.onChange}
                              disabled={false}
                              className="w-full"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {otpSent && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm} 
                      className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                    >
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white"
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}